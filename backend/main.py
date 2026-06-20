"""LKM Backend — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.database import init_db, close_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_pool()


app = FastAPI(
    title="LKM Backend",
    description="理科迷 (LKM) 官方网站后端 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.contact import router as contact_router
from routers.comments import router as comments_router
from routers.events import router as events_router
from routers.content import router as content_router
from routers.upload import router as upload_router
from routers.search import router as search_router
from routers.analytics import router as analytics_router

app.include_router(contact_router)
app.include_router(comments_router)
app.include_router(events_router)
app.include_router(content_router)
app.include_router(upload_router)
app.include_router(search_router)
app.include_router(analytics_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
