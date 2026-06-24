# Cloud Cost Optimizer

AI-powered cloud cost optimization platform. Analyzes AWS EC2 utilization, Kubernetes workload usage, and storage costs, then uses an LLM to recommend rightsizing, reserved instance purchases, and idle resource cleanup.

## Tech Stack

- **AWS** — Cost Explorer, CloudWatch, EC2, S3/EBS APIs
- **Terraform** — provisions the read-only IAM role and supporting infra (e.g. scheduled Lambda/ECS task) used by the analyzer
- **Kubernetes** — usage metrics pulled via `metrics-server` / Prometheus from clusters being analyzed
- **LLM** — turns raw utilization data into prioritized, explained recommendations
- **Cloud APIs** — boto3 (AWS), kubernetes python client

## Repo Layout

```
terraform/        # IAM roles + infra for the analyzer to run with least privilege
backend/          # Python service: collectors + LLM recommender + API
  app/
    collectors/   # EC2, Kubernetes, storage utilization collectors
    recommenders/ # LLM-backed recommendation engine
    main.py       # FastAPI entrypoint
k8s/              # Deployment manifests to run the backend in-cluster
```

## How It Works

1. **Collect** — pull utilization data for EC2 instances (CloudWatch CPU/mem/network), Kubernetes workloads (requests vs. actual usage), and storage (EBS/S3 access patterns + cost via Cost Explorer).
2. **Analyze** — normalize collected metrics into a per-resource utilization profile.
3. **Recommend** — feed profiles to an LLM which proposes rightsizing, reserved instance/savings-plan purchases, and idle resource cleanup, with rationale and estimated savings.
4. **Surface** — expose recommendations via API for review/approval before any action is taken.

No recommendation is auto-applied; this platform surfaces actionable suggestions for a human (or a separate, explicitly-approved automation step) to execute.

## Getting Started

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in AWS credentials + LLM API key
uvicorn app.main:app --reload
```

```bash
cd terraform
terraform init
terraform plan
```
