from typing import Optional
from pydantic import BaseModel


class KpiItem(BaseModel):
    id: str
    value: str
    delta: str
    up: bool
    good: Optional[bool] = None


class TimeSeriesData(BaseModel):
    labels: list[str]
    values: list[float]


class ProviderBreakdown(BaseModel):
    name: str
    pct: float
    value: str
    color: str


class ModelBreakdown(BaseModel):
    name: str
    pct: float
    value: str


class TopService(BaseModel):
    name: str
    name_en: str
    reqs: str
    cost: str
    trend: str
