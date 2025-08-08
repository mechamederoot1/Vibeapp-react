from fastapi import APIRouter

router = APIRouter()

@router.get("/trending")
async def get_trending():
    return {"message": "Trending endpoint"}

@router.get("/places")
async def get_nearby_places():
    return {"message": "Nearby places endpoint"}

@router.get("/content")
async def get_explore_content():
    return {"message": "Explore content endpoint"}
