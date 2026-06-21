from fastapi import APIRouter
from api.v1 import models, services, conversations, messages, usage, playground, api_keys, ingest

router = APIRouter()

router.include_router(models.router)
router.include_router(services.router)
router.include_router(conversations.router)
router.include_router(messages.router)
router.include_router(usage.router)
router.include_router(playground.router)
router.include_router(api_keys.router)
router.include_router(ingest.router)
