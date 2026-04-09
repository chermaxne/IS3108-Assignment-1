import http from "./http"

export async function getDashboardSummary() {
  const response = await http.get("/api/dashboard/summary")
  return response.data
}