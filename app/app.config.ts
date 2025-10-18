export default defineAppConfig({
  ui: {

    icons: {
      loading: 'line-md:loading-loop'
    },

    button: {
      slots: {
        base: [
          'cursor-pointer text-white dark:text-white',
        ]
      }
    },

    input: {
      variants: {
        variant: {
          agreement: 'text-black bg-black/10 hover:bg-black/20 focus:bg-black/20 '
        },
      }
    },

    timeline: {
      slots: {
        root: 'flex gap-1.5',
        item: 'group relative flex flex-1 gap-3',
        container: 'relative flex items-center gap-1.5',
        indicator: 'group-data-[state=completed]:text-inverted group-data-[state=active]:text-inverted text-white  bg-primary dark:bg-white dark:text-primary size-12 text-3xl',
        separator: 'flex-1 rounded-full bg-primary dark:bg-white',
        wrapper: 'w-full',
        date: 'text-dimmed text-xs/5',
        title: 'font-medium text-highlighted text-sm',
        description: 'text-muted text-wrap text-sm'
      }
    },

    stepper: {
      slots: {
        trigger: 'group-data-[state=completed]:text-white group-data-[state=active]:dark:bg-white group-data-[state=active]:text-inverted text-primary dark:text-white bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2',
        separator: 'group-data-[disabled]:opacity-75 bg-accented',
        title: 'text-default',
        description: 'text-muted',
      }
    },

    modal: {
      slots: {
        overlay: 'fixed inset-0 bg-black/75 dark:bg-black/50 backdrop-blur-xs',
        // header: 'flex items-center gap-1.5 p-4 sm:px-6 min-h-12',
        // body: 'flex-1 overflow-y-auto px-4 py-0 sm:py-0',
        // title: 'text-black font-semibold',
        // content: 'bg-white divide-none',
        // close: 'text-black hover:text-white dark:text-black dark:hover:text-white'
      }
    },

    slideover: {
      slots: {
        overlay: 'fixed inset-0 bg-black/75 dark:bg-black/50 backdrop-blur-xs',
      }
    },

    inputNumber: {
      slots: {
        increment: '[&>button]:cursor-pointer',
        decrement: '[&>button]:cursor-pointer'
      }
    },

    pagination: {
      slots: {
        first: 'cursor-pointer',
        prev: 'cursor-pointer',
        item: 'cursor-pointer',
        next: 'cursor-pointer',
        last: 'cursor-pointer'
      }
    },

    table: {
      slots: {
        tbody: 'divide-y divide-gray-300',
        th: 'text-primary font-bold', 
        td: 'px-4 py-2 text-sm text-primary'
      }
    },

    tabs: {
      slots: {
        trigger: [
          'grow cursor-pointer data-[state=active]:bg-secondary',
        ]
      }
    }

  }
})
