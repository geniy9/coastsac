// app.config.ts
export default defineAppConfig({
  ui: {

    colors: {
      primary: 'coast',
      neutral: 'slate'
    },

    icons: {
      loading: 'line-md:loading-loop'
    },

    button: {
      slots: {
        base: [
          'cursor-pointer',
        ]
      }
    },

    input: {
      variants: {
        variant: {
          agreement: 'text-black bg-black/10 hover:bg-black/20 focus:bg-black/20 '
        }
      }
    },

    inputTags: {
      slots: { 
        base: 'px-1.5 py-1.5', 
        item: 'px-1 py-0.5 gap-1'
      },
      variants: {
        size: {
          md: {
            base: 'px-1.5 py-1.5'
          }
        }
      }
    },

    selectMenu: {
      variants: {
        fieldGroup: {
          horizontal: 'first:!rounded-e-none !rounded-e-md',
        },
      }
    },

    timeline: {
      slots: {
        root: 'flex gap-1.5',
        item: 'group relative flex flex-1 gap-3',
        container: 'relative flex items-center gap-1.5',
        indicator: 'group-data-[state=completed]:text-inverted group-data-[state=active]:text-inverted text-white  bg-primary dark:bg-white dark:text-primary size-10 text-3xl',
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

    dropdownMenu: {
      slots: {
        item: 'cursor-pointer',
      }
    },

    separator: {
      slots: {
        label: 'text-(--ui-primary)'
      },
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
          'cursor-pointer',
        ]
      }
    },

    switch: {
      slots: {
        base: [
          'cursor-pointer'
        ]
      }
    },

    pricingPlan: {
      slots: {
        root: 'rounded-3xl',
        title: 'text-black font-bold',
        description: 'text-black',
        price: 'text-coast font-bold',
        billingPeriod: 'text-zinc-600',
        billingCycle: 'text-black',
        featureIcon: 'text-coast',
        featureTitle: 'text-black',
        badge: 'rounded-full bg-coast text-white',
      },
      variants: {
        orientation: {
          horizontal: {
            body: 'lg:pr-6',
          }
        },
        highlight: {
          true: {
            root: 'ring-coast'
          }
        }
      }
    },

    chatMessage: {
      slots: {
        content: '!px-3 !py-1 !min-h-6 print:bg-elevated/5 sm:text-sm',
        leading: '!mt-0',
      },
      variants: {
        compact: {
          true: {
            container: 'gap-1.5 pb-2',
          },
          false: {
            container: 'gap-3 pb-4',
          }
        }
      },
    },

    card: {
      variants: {
        variant: {
          soft: {
            root: 'print:divide-none'
          },
        }
      }
    },

  }
})
