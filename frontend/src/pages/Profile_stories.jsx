// Load user stories
        try {
          const storiesResponse = await storiesAPI.getUserStories(user.id)
          setUserStories(storiesResponse.data.stories || [])
          // Set hasStory flag for avatar ring
          setProfileData(prev => ({ 
            ...prev, 
            hasStory: (storiesResponse.data.total || 0) > 0 
          }))
        } catch (error) {
          console.error('Error loading user stories:', error)
          setUserStories([])
        }
