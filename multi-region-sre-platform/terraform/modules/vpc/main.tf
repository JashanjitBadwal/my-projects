variable "region" {
  type = string
}

variable "name" {
  type = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "az_count" {
  type    = number
  default = 3
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # Pin to the first az_count AZs so subnet CIDR allocation below stays
  # stable across applies even if AWS returns AZs in a different order.
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.name}-vpc"
  }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${var.name}-igw"
  }
}

# Public subnets host NAT gateways and internet-facing ALBs/NLBs. The
# kubernetes.io/role/elb tag lets the AWS Load Balancer Controller
# auto-discover these subnets without manual subnet IDs in the Service spec.
resource "aws_subnet" "public" {
  count                   = var.az_count
  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name                     = "${var.name}-public-${local.azs[count.index]}"
    "kubernetes.io/role/elb" = "1"
  }
}

# Private subnets host EKS worker nodes. Offsetting by az_count keeps
# public/private CIDR ranges from overlapping within the /16.
resource "aws_subnet" "private" {
  count             = var.az_count
  vpc_id            = aws_vpc.this.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + var.az_count)
  availability_zone = local.azs[count.index]

  tags = {
    Name                              = "${var.name}-private-${local.azs[count.index]}"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# One NAT gateway per AZ (not a single shared one) so a single NAT/AZ
# failure can't take down outbound traffic for the whole region.
resource "aws_eip" "nat" {
  count  = var.az_count
  domain = "vpc"
}

resource "aws_nat_gateway" "this" {
  count         = var.az_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.name}-nat-${local.azs[count.index]}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = {
    Name = "${var.name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = var.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Per-AZ route table (rather than one shared table) so each private subnet
# egresses through its own AZ's NAT gateway, matching the per-AZ NAT setup above.
resource "aws_route_table" "private" {
  count  = var.az_count
  vpc_id = aws_vpc.this.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this[count.index].id
  }

  tags = {
    Name = "${var.name}-private-rt-${local.azs[count.index]}"
  }
}

resource "aws_route_table_association" "private" {
  count          = var.az_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

output "vpc_id" {
  value = aws_vpc.this.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}
