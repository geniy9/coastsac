// store/api.js
import { defineStore } from 'pinia'

export const useApiStore = defineStore('api', {
  state: () => ({
    categories: [],
    // Глобальные настройки пагинации
    defaultPageSize: 25,
    pageSizeOptions: [25, 50, 100]
  }),

  actions: {
    async getCategories(locale) {
      const { find } = useStrapi()
      const res = await find('categories', { 
        locale: locale,
        sort: ["sort_number:asc"]
      })
      if (res) this.categories = res.data
    }
  }
})