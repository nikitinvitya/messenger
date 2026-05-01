import {api} from "@/shared/api";

export const uploadMedia = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await api.post("media/upload", formData)
  return response.data
}
