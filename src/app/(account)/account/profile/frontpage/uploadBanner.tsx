'use client'
import { useToast } from '@/components/ui/use-toast'
import { UserAvatarsDocumentType } from '@/utils/types'
import { databases, ID, storage } from '@/app/appwrite-client'
import * as Sentry from '@sentry/nextjs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function UploadAvatar({
  isUploading,
  setIsUploading,
  userMe,
  userData,
}) {
  const { toast } = useToast()

  const getAvatarImageUrl = (galleryId: string) => {
    if (!galleryId) return
    const imageId = storage.getFilePreview(
      '655842922bac16a94a25',
      `${galleryId}`,
      400
    )
    return imageId.href
  }

  const handleAvatarChange = (event: any) => {
    const selectedFile = event.target.files[0]
    if (selectedFile.size > 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Dateigröße darf nur bis 1MB groß sein.',
        variant: 'destructive',
      })
      return
    }
    const fileReader = new FileReader()
    fileReader.readAsDataURL(selectedFile)
    fileReader.onload = (event) => {
      const imgElement = document.getElementById(
        'avatar-image'
      ) as HTMLImageElement
      if (typeof event.target.result === 'string') {
        imgElement.src = event.target.result
        const img = new Image()
        img.src = event.target.result
        //img.onload = () => {
        //  setSelectedFile(selectedFile)
        //}
      }
    }
  }

  const handleSubmitAvatar = async (event: any) => {
    event.preventDefault()

    try {
      // Year-Month-Day (YYYY-MM-DD)

      setIsUploading(true) // Set isUploading to true before making the API call

      // Get the user's avatar document
      const avatarDocument: UserAvatarsDocumentType =
        await databases.getDocument('hp_db', 'userdata', userMe.$id)
      // If the user already has an avatar, delete it
      if (avatarDocument.galleryId) {
        // Delete the old avatar
        console.log('deleting')
        await storage.deleteFile(
          '655842922bac16a94a25',
          avatarDocument.galleryId
        )
      }

      // Upload the new avatar
      const fileData = storage.createFile(
        '655842922bac16a94a25',
        ID.unique(),
        (document.getElementById('avatar-upload') as HTMLInputElement).files[0]
      )

      fileData.then(
        function (response) {
          // Update the user's avatarId
          databases.updateDocument('hp_db', 'userdata', userMe.$id, {
            avatarId: response.$id,
          })

          toast({
            title: 'Avatar uploaded',
            description: 'Your avatar has been uploaded successfully.',
          })
        },
        function (error) {
          if (error.type === 'storage_file_empty') {
            toast({
              title: 'Error',
              description: 'Missing file.',
              variant: 'destructive',
            })
          } else if (error.type === 'storage_invalid_file_size') {
            toast({
              title: 'Error',
              description:
                'The file size is either not valid or exceeds the maximum allowed size.',
              variant: 'destructive',
            })
          } else if (error.type === 'storage_file_type_unsupported') {
            toast({
              title: 'Error',
              description: 'The given file extension is not supported.',
              variant: 'destructive',
            })
          } else if (error.type === 'storage_invalid_file') {
            toast({
              title: 'Error',
              description:
                'The uploaded file is invalid. Please check the file and try again.',
              variant: 'destructive',
            })
          } else if (error.type === 'storage_device_not_found') {
            toast({
              title: 'Error',
              description: 'The requested storage device could not be found.',
              variant: 'destructive',
            })
          } else {
            toast({
              title: 'Error',
              description: 'Failed to upload avatar.',
              variant: 'destructive',
            })
            Sentry.captureException(error)
          }
        }
      )

      setIsUploading(false)
    } catch (error) {
      setIsUploading(false)
      console.error(error)
      Sentry.captureException(error)
      toast({
        title: 'Error',
        description: 'Failed to upload avatar.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
      <div className="col-span-full flex items-center gap-x-8">
        <img
          id="avatar-image"
          src={getAvatarImageUrl(userData?.avatarId) || '/logos/logo.webp'}
          alt="Avatar"
          className="h-24 w-24 flex-none rounded-lg bg-gray-800 object-cover"
        />
        <div>
          <Input
            accept="image/*"
            className="rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/10 hover:bg-white/20 dark:ring-white/10"
            id="avatar-upload"
            name="avatar-upload"
            type="file"
            onChange={handleAvatarChange}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-900 dark:text-gray-400">
              JPG, GIF or PNG. 1MB max.
            </p>
            <Button
              type="submit"
              onClick={handleSubmitAvatar}
              disabled={isUploading}
              className={'mt-2'}
            >
              Submit
            </Button>
          </div>
          <p className="text-xs text-gray-900 dark:text-gray-400">
            1024x1024 max. resolution
          </p>
        </div>
      </div>
    </div>
  )
}
