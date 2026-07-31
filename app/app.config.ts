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
          horizontal: '!rounded-r-md',
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
        root: 'relative grid rounded-3xl p-6 lg:p-8 xl:p-10 gap-6',
        header: '',
        body: 'flex flex-col min-w-0',
        footer: 'flex flex-col gap-6 items-center',
        titleWrapper: 'flex items-center gap-3',
        title: 'text-highlighted truncate text-2xl sm:text-3xl text-black font-bold',
        description: 'text-black text-base text-pretty mt-2',
        priceWrapper: 'flex items-center gap-1',
        price: 'text-coast text-3xl sm:text-4xl font-bold',
        discount: 'text-muted line-through text-xl sm:text-2xl',
        billing: 'flex flex-col justify-between min-w-0',
        billingPeriod: 'text-zinc-600 truncate text-xs font-medium',
        billingCycle: 'text-black truncate text-xs font-medium',
        features: 'flex flex-col gap-3 flex-1 mt-6 grow-0',
        feature: 'flex items-center gap-2 min-w-0',
        featureIcon: 'size-5 shrink-0 text-coast',
        featureTitle: 'text-black text-sm truncate',
        badge: 'rounded-full bg-coast text-white',
        button: '',
        tagline: 'text-base font-semibold text-default',
        terms: 'text-xs/5 text-muted text-center text-balance'
      },
      variants: {
        orientation: {
          horizontal: {
            root: 'grid-cols-1 lg:grid-cols-3 justify-between divide-y lg:divide-y-0 lg:divide-x divide-default',
            body: 'lg:col-span-2 pb-6 lg:pb-0 lg:pr-6 justify-center',
            footer: 'lg:justify-center lg:items-center lg:p-6 lg:max-w-xs lg:w-full lg:mx-auto',
            features: 'lg:grid lg:grid-cols-2 lg:mt-12'
          },
          vertical: {
            footer: 'justify-end',
            priceWrapper: 'mt-6'
          }
        },
        variant: {
          solid: {
            root: 'bg-inverted',
            title: 'text-inverted',
            description: 'text-dimmed',
            price: 'text-inverted',
            discount: 'text-dimmed',
            billingCycle: 'text-dimmed',
            billingPeriod: 'text-dimmed',
            featureTitle: 'text-dimmed'
          },
          outline: {
            root: 'bg-default ring ring-default'
          },
          soft: {
            root: 'bg-elevated/50'
          },
          subtle: {
            root: 'bg-elevated/50 ring ring-default'
          }
        },
        highlight: {
          true: {
            root: 'ring-3 ring-inset ring-coast'
          }
        },
        scale: {
          true: {
            root: 'lg:scale-[1.1] lg:z-[1]'
          }
        }
      },
      compoundVariants: [
        {
          orientation: 'horizontal',
          variant: 'soft',
          class: {
            root: 'divide-accented'
          }
        },
        {
          orientation: 'horizontal',
          variant: 'subtle',
          class: {
            root: 'divide-accented'
          }
        }
      ]
    },

    chatMessage: {
      slots: {
        content: '!px-3 !py-1 !min-h-8 print:bg-elevated/5',
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
    }

  }
})
