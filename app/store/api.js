import { defineStore } from 'pinia'

export const useApiStore = defineStore('api', {
  state: () => ({

    selectedCategory: null,
    loadingServices: false,

    searchValue: '',

    categories: [],
    services: [],

  }),

  actions: {

    async getCategories(locale) {
      const { find } = useStrapi()
      const res = await find('categories', { 
        locale: locale,
        sort: ["sort_number:asc"]
      })
      if (res) this.categories = res.data
    },

    async getCategory(locale, categorySlug) {
      const { find } = useStrapi()
      const res = await find('categories', { 
        locale: locale,
        filters: { 
          slug: { $eq: categorySlug }
        }
      })
      if (res) this.selectedCategory = res.data
    },

    async fetchServices(locale) {
      this.loadingServices = true
      const { find } = useStrapi()
      
      try {
        const res = await find('services', {
          locale: locale || 'en',
          populate: {
            category: true,
            variants: { populate: ['images'] }
          }
        });

        if (res?.data) {
          this.services = res.data
        } else {
          this.services = []
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        this.services = []
      } finally {
        this.loadingServices = false;
      }
    },

    async getServicesByCategory(locale, categorySlug) {
      this.loadingProducts = true;
      const { find } = useStrapi();
      try {
        const res = await find('products', {
          locale: locale || 'en',
          populate: {
            category: true,
            variants: { populate: ['images'] }
          },
          filters: { 
            category: { 
              slug: { $eq: categorySlug } 
            } 
          }
        });
        if (res?.data) {
          this.services = res.data
        } else {
          this.services = [];
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        this.services = [];
      } finally {
        this.loadingServices = false;
      }
    },

  },

})