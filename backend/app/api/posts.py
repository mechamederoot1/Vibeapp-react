from fastapi import APIRouter

router = APIRouter()

@router.get("/feed")
async def get_feed():
    return {"message": "Feed endpoint"}

@router.post("/")
async def create_post():
    return {"message": "Create post endpoint"}

@router.get("/{post_id}")
async def get_post(post_id: int):
    return {"message": f"Get post {post_id}"}
