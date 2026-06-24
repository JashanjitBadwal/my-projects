import os

from dotenv import load_dotenv
from fastapi import FastAPI

from app.collectors import ec2, k8s, storage
from app.models import Recommendation, UtilizationProfile
from app.recommenders import llm

load_dotenv()

app = FastAPI(title="Cloud Cost Optimizer")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/utilization", response_model=list[UtilizationProfile])
def get_utilization() -> list[UtilizationProfile]:
    region = os.environ.get("AWS_REGION", "us-east-1")
    profiles: list[UtilizationProfile] = []
    profiles += ec2.collect(region)
    profiles += storage.collect(region)
    profiles += k8s.collect(os.environ.get("KUBE_CONFIG_PATH"))
    return profiles


@app.get("/recommendations", response_model=list[Recommendation])
def get_recommendations() -> list[Recommendation]:
    profiles = get_utilization()
    return llm.recommend(profiles)
