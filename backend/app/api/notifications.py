from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_notifications():
    return {"message": "Notifications endpoint"}

@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: int):
    return {"message": f"Mark notification {notification_id} as read"}

@router.put("/read-all")
async def mark_all_notifications_read():
    return {"message": "Mark all notifications as read"}
