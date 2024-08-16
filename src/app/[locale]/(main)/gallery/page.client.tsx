'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { databases, Query, storage } from '@/app/appwrite-client'
import * as Sentry from '@sentry/nextjs'
import { useToast } from '@/components/ui/use-toast'
import { Link } from '@/navigation'
import { Gallery } from '@/utils/types/models'
import { ImageFormat } from 'node-appwrite'

export default function FetchGallery({ enableNsfw }) {
  const [gallery, setGallery] = useState<Gallery.GalleryDocumentsType[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const getGalleryImageUrl = (
    galleryId: string,
    output: ImageFormat = ImageFormat.Jpg
  ) => {
    if (!galleryId) return

    const imageId = storage.getFilePreview(
      'gallery',
      `${galleryId}`,
      256,
      256,
      undefined,
      50,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      output
    )
    return imageId.href
  }

  const getVideoUrl = (galleryId: string) => {
    if (!galleryId) return
    const videoId = storage.getFileView('gallery', `${galleryId}`)
    return videoId.href
  }

  useEffect(() => {
    const fetchGalleryData = async () => {
      const pageSize = 500 // Number of items per page
      const offset = (currentPage - 1) * pageSize // Calculate offset based on current page
      //const filters = !enableNsfw ? `&queries[]=equal("nsfw",false)` : ``

      const filters = !enableNsfw
        ? [
            Query.equal('nsfw', false),
            Query.limit(pageSize),
            Query.offset(offset),
            Query.orderDesc('$createdAt'),
          ]
        : [
            Query.limit(pageSize),
            Query.offset(offset),
            Query.orderDesc('$createdAt'),
          ]

      //const apiUrl = `${filters}&queries[]=limit(${pageSize})&queries[]=offset(${offset})`
      const gallery: Gallery.GalleryType = await databases.listDocuments(
        'hp_db',
        'gallery-images',
        filters
      )

      try {
        //const data: GalleryType = await getGallery(apiUrl)

        setGallery(gallery.documents)
        setTotalPages(gallery.total / pageSize)
      } catch (error) {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        })
        Sentry.captureException(error)
      }
    }

    fetchGalleryData().catch((error) => {
      toast({
        title: 'Error',
        description: "You encountered an error. But don't worry, we're on it.",
        variant: 'destructive',
      })
      Sentry.captureException(error)
    })
  }, [currentPage, enableNsfw, toast])

  return (
    <div>
      <div>
        <ul className="flex flex-wrap items-center justify-center gap-4 p-8">
          {gallery &&
            gallery.map((item) => {
              const format = item.mimeType?.split('/').pop()
              const imageFormat = format
                ? (ImageFormat[
                    format.charAt(0).toUpperCase() + format.slice(1)
                  ] as ImageFormat)
                : undefined

              return (
                <div key={item.$id}>
                  {item && (
                    <div
                      className={`h-64 w-64 overflow-hidden rounded-lg ${
                        item.nsfw && !enableNsfw ? 'relative' : ''
                      }`}
                    >
                      {item.nsfw && !enableNsfw && (
                        <div className="absolute inset-0 bg-black opacity-50"></div>
                      )}
                      <Link
                        href={{
                          pathname: '/gallery/[galleryId]',
                          params: { galleryId: item.$id },
                        }}
                      >
                        {item?.mimeType?.includes('video') && (
                          <div className="relative h-full w-full">
                            <video
                              className="h-full w-full object-cover"
                              controls
                              controlsList="nodownload"
                              autoPlay={false}
                              loop={true}
                              muted={true}
                              draggable={false}
                              playsInline={true}
                            >
                              <source
                                src={getVideoUrl(item.galleryId)}
                                type="video/mp4"
                              />
                            </video>
                          </div>
                        )}
                        <Image
                          src={getGalleryImageUrl(item.galleryId, imageFormat)}
                          alt={item.name || 'Gallery Image'}
                          className={`h-full max-h-[600px] w-full max-w-[600px] object-cover`}
                          width={600}
                          height={600}
                          draggable={false}
                          loading="lazy"
                          unoptimized={true}
                        />
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
        </ul>
      </div>
    </div>
  )
}
