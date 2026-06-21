from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, Float, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Model(Base):
    __tablename__ = "models"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    version: Mapped[str] = mapped_column(String, nullable=False)
    params: Mapped[str] = mapped_column(String, nullable=False, default="—")
    category: Mapped[str] = mapped_column(String, nullable=False)
    context_window: Mapped[str] = mapped_column(String, nullable=False)
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    services: Mapped[list["Service"]] = relationship("Service", back_populates="model_ref")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    name_en: Mapped[str] = mapped_column(String, nullable=False)
    model_id: Mapped[str] = mapped_column(String, ForeignKey("models.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    rag_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="stopped")
    favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    requests_30d: Mapped[str] = mapped_column(String, nullable=False, default="0")
    avg_latency: Mapped[str] = mapped_column(String, nullable=False, default="—")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    model_ref: Mapped["Model"] = relationship("Model", back_populates="services")
    conversations: Mapped[list["Conversation"]] = relationship("Conversation", back_populates="service_ref")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    title_en: Mapped[str] = mapped_column(String, nullable=False)
    service_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("services.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    service_ref: Mapped[Optional["Service"]] = relationship("Service", back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="conversation_ref")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversations.id"), nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    model_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    citations: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    token_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    conversation_ref: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")


class UsageRecord(Base):
    __tablename__ = "usage_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_id: Mapped[str] = mapped_column(String, nullable=False)
    model_id: Mapped[str] = mapped_column(String, nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    key_hash: Mapped[str] = mapped_column(String, nullable=False)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
