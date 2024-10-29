'use client'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import React from 'react'
import { useRealtimeChat } from '@/hooks/useRealtimeChat'
import PageLayout from '@/components/pageLayout'
import {
  getAvatarImageUrlPreview,
  getCommunityAvatarUrlPreview,
} from '@/components/getStorageItem'
import { useUser } from '@/components/contexts/UserContext'
import { useEffect, useState, useCallback } from 'react'
import { databases, functions } from '@/app/appwrite-client'
import { toast } from 'sonner'
import { Menu, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'
import { Query } from 'appwrite'
import { ExecutionMethod } from 'node-appwrite'
import { Community, Messaging, UserData } from '@/utils/types/models'
import { Users } from 'lucide-react'
import { useRouter } from '@/i18n/routing'

export default function ChatLayout(props) {
  const router = useRouter()
  const { conversations } = useRealtimeChat()
  const { current } = useUser()
  const [displayUsers, setDisplayUsers] = useState({})
  const [userCache, setUserCache] = useState({})
  const [isOpen, setIsOpen] = useState(false)
  const [communityCache, setCommunityCache] = useState({})

  useEffect(() => {
    if (!current) {
      router.push('/login')
    }
  }, [current, router])

  if (!current) {
    return null // or a loading indicator
  }

  const fetchUserData = useCallback(
    async (userId: string) => {
      if (userCache[userId]) {
        return userCache[userId]
      }

      try {
        const userData: UserData.UserDataDocumentsType =
          await databases.getDocument('hp_db', 'userdata', userId)
        setUserCache((prevCache) => ({ ...prevCache, [userId]: userData }))
        return userData
      } catch (error) {
        toast.error('Error fetching user data')
        return null
      }
    },
    [userCache]
  )

  const fetchCommunityData = useCallback(
    async (communityId: string) => {
      if (communityCache[communityId]) {
        return communityCache[communityId]
      }

      try {
        const communityData: Community.CommunityDocumentsType =
          await databases.getDocument('hp_db', 'community', communityId)
        setCommunityCache((prevCache) => ({
          ...prevCache,
          [communityId]: communityData,
        }))
        return communityData
      } catch (error) {
        toast.error('Error fetching community data')
        return null
      }
    },
    [communityCache]
  )

  useEffect(() => {
    const updateDisplayUsers = async () => {
      const newDisplayUsers = {}
      for (const conversation of conversations) {
        if (conversation.communityId) {
          const communityData: Community.CommunityDocumentsType =
            await fetchCommunityData(conversation.communityId)
          if (communityData) {
            newDisplayUsers[conversation.$id] = {
              isCommunity: true,
              ...communityData,
            }
          }
        } else if (conversation.participants) {
          const otherParticipantId = conversation.participants.find(
            (participant) => participant !== current.$id
          )
          if (otherParticipantId) {
            const userData: UserData.UserDataDocumentsType =
              await fetchUserData(otherParticipantId)
            if (userData) {
              newDisplayUsers[conversation.$id] = userData
            }
          }
        }
      }
      setDisplayUsers(newDisplayUsers)
    }

    updateDisplayUsers()
  }, [conversations, current.$id])

  const closeSheet = () => setIsOpen(false)

  return (
    <PageLayout title={'Chat'}>
      <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden p-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button>
                <Menu className="mr-2" /> See conversations
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <ConversationsList
                conversations={conversations}
                displayUsers={displayUsers}
                closeSheet={closeSheet}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-[300px] lg:w-[400px] border-r border-gray-200 overflow-y-auto">
          <ConversationsList
            conversations={conversations}
            displayUsers={displayUsers}
            closeSheet={closeSheet}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">{props.children}</div>
      </div>
    </PageLayout>
  )
}

// Updated ConversationsList component
function ConversationsList({
  conversations,
  displayUsers,
  closeSheet,
}: {
  conversations: Messaging.MessageConversationsDocumentsType[]
  displayUsers: any
  closeSheet: () => void
}) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    const searchUsers = async () => {
      if (debouncedSearchTerm) {
        setIsLoading(true)
        try {
          const results = await databases.listDocuments('hp_db', 'userdata', [
            Query.contains('profileUrl', debouncedSearchTerm),
          ])
          setSearchResults(results.documents)
        } catch (error) {
          toast.error('Error searching users')
        } finally {
          setIsLoading(false)
        }
      } else {
        setSearchResults([])
      }
    }

    searchUsers()
  }, [debouncedSearchTerm])

  const createConversation = async (recipientId) => {
    const loadingToast = toast.loading('Creating conversation...')
    try {
      const data = await functions.createExecution(
        'user-endpoints',
        '',
        false,
        `/user/chat/conversation?recipientId=${recipientId}`,
        ExecutionMethod.POST
      )
      toast.dismiss(loadingToast)
      const response = JSON.parse(data.responseBody)
      console.log(response)
      if (response.type === 'userchat_missing_recipient_id') {
        toast.error('Missing recipient ID')
      } else if (response.type === 'userchat_recipient_does_not_exist') {
        toast.error('Recipient does not exist')
      } else if (
        response.type === 'userchat_recipient_cannot_be_the_same_as_the_user'
      ) {
        toast.error('Cannot create conversation with yourself')
      } else {
        router.push({
          pathname: '/chat/[conversationId]',
          params: { conversationId: response.$id },
        })
      }
      setIsModalOpen(false)
    } catch (error) {
      toast.error('Error fetching conversation. Please try again later.')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Conversations</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Create New Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user.$id}
                      className="flex items-center p-2 cursor-pointer hover:bg-foreground/10"
                      onClick={() => createConversation(user.$id)}
                    >
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={getAvatarImageUrlPreview(
                            user.avatarId,
                            'width=100&height=100'
                          )}
                          alt={user.displayName}
                        />
                        <AvatarFallback>
                          {user.displayName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.displayName}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>No results found</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="flex-grow">
        {conversations.map((conversation) => {
          const displayData = displayUsers[conversation.$id] || {}
          const isCommunity = displayData.isCommunity

          return (
            <Link
              href={`/chat/${conversation.$id}`}
              onClick={closeSheet}
              className="flex items-center p-4 cursor-pointer hover:bg-foreground/10 w-full"
              key={conversation.$id}
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={
                      isCommunity
                        ? getCommunityAvatarUrlPreview(
                            displayData.avatarId,
                            'width=250&height=250'
                          )
                        : getAvatarImageUrlPreview(
                            displayData.avatarId,
                            'width=250&height=250'
                          ) || null
                    }
                    alt={
                      isCommunity ? displayData.name : displayData.displayName
                    }
                  />
                  <AvatarFallback>
                    {isCommunity
                      ? displayData.name?.charAt(0)
                      : displayData.displayName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isCommunity && (
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                    <Users size={12} />
                  </div>
                )}
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex items-center">
                  <p className="font-semibold">
                    {isCommunity ? displayData.name : displayData.displayName}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {conversation?.lastMessage}
                </p>
              </div>
            </Link>
          )
        })}
      </ScrollArea>
    </div>
  )
}
