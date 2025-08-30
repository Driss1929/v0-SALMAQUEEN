"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, TrendingUp, MessageSquare, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface SearchAndFilterProps {
  onSearch: (query: string) => void
  onSort: (sortBy: string) => void
  onFilter: (filters: FilterOptions) => void
  searchQuery: string
  sortBy: string
  activeFilters: FilterOptions
}

interface FilterOptions {
  postType?: string
  dateRange?: string
  hasMedia?: boolean
  minLikes?: number
  minComments?: number
}

export default function SearchAndFilter({
  onSearch,
  onSort,
  onFilter,
  searchQuery,
  sortBy,
  activeFilters,
}: SearchAndFilterProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterOptions>(activeFilters)

  const handleSearchChange = (value: string) => {
    onSearch(value)
  }

  const handleSortChange = (value: string) => {
    onSort(value)
  }

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilter(newFilters)
  }

  const clearFilter = (key: keyof FilterOptions) => {
    const newFilters = { ...localFilters }
    delete newFilters[key]
    setLocalFilters(newFilters)
    onFilter(newFilters)
  }

  const clearAllFilters = () => {
    setLocalFilters({})
    onFilter({})
  }

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).length
  }

  return (
    <div className="space-y-4">
      {/* Search and Sort Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search posts by title or content..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at_desc">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Newest first
              </div>
            </SelectItem>
            <SelectItem value="created_at_asc">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Oldest first
              </div>
            </SelectItem>
            <SelectItem value="likes_count_desc">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Most liked
              </div>
            </SelectItem>
            <SelectItem value="comments_count_desc">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Most commented
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {getActiveFilterCount() > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
      </div>

      {/* Active Filters */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.postType && (
            <Badge variant="secondary" className="gap-1">
              Type: {activeFilters.postType}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("postType")} />
            </Badge>
          )}
          {activeFilters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              Date: {activeFilters.dateRange}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("dateRange")} />
            </Badge>
          )}
          {activeFilters.hasMedia && (
            <Badge variant="secondary" className="gap-1">
              Has media
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("hasMedia")} />
            </Badge>
          )}
          {activeFilters.minLikes && (
            <Badge variant="secondary" className="gap-1">
              Min likes: {activeFilters.minLikes}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("minLikes")} />
            </Badge>
          )}
          {activeFilters.minComments && (
            <Badge variant="secondary" className="gap-1">
              Min comments: {activeFilters.minComments}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter("minComments")} />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Post Type</label>
                <Select
                  value={localFilters.postType || "all"}
                  onValueChange={(value) => handleFilterChange("postType", value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="text">Text only</SelectItem>
                    <SelectItem value="image">With images</SelectItem>
                    <SelectItem value="video">With videos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select
                  value={localFilters.dateRange || "all"}
                  onValueChange={(value) => handleFilterChange("dateRange", value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Likes</label>
                <Select
                  value={localFilters.minLikes?.toString() || "any"}
                  onValueChange={(value) => handleFilterChange("minLikes", value ? Number.parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                    <SelectItem value="10">10+</SelectItem>
                    <SelectItem value="25">25+</SelectItem>
                    <SelectItem value="50">50+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Comments</label>
                <Select
                  value={localFilters.minComments?.toString() || "any"}
                  onValueChange={(value) =>
                    handleFilterChange("minComments", value ? Number.parseInt(value) : undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                    <SelectItem value="10">10+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
