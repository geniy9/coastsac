export default () => {
  return {
    menuMain: [{
      name: 'home',
      to: '/',
      className: ''
    },{
      name: 'services',
      to: '/services',
      className: ''
    },{
      name: 'trucking_authority',
      to: '/trucking-authority',
      className: ''
    },{
      name: 'bookkeeping',
      to: '/bookkeeping',
      className: 'coast_to_coast'
    }],
    menuPhones: [{
      name: '<span>East Coast, South and Midwest: </span>+1 (302) 366-4436',
      to: 'tel:13023664436'
    },{
      name: '<span>West Coast: </span> +1 (916) 739-2940 (ext 103)',
      to: 'tel:19167392940' 
    },{
      name: '<span>Fax: </span> +1 (659)209-3337',
      to: 'tel:16592093337' 
    }],
    menuPhonesCoast: [{
      name: '<span>Coast to Coast: </span>+1 (916) 968-7082',
      to: 'tel:19169687082'
    }],
  }
}