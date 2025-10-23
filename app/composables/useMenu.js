export default () => {
  return {
    menuMain: [{
      name: 'home',
      to: '/'
    },{
      name: 'services',
      to: '/services'
    },{
      name: 'trucking_authority',
      to: '/trucking-authority'
    },{
      name: 'contacts',
      to: '/#contacts'
    }],
    menuPhones: [{
      name: '<span class="text-primary dark:text-gray-600">East Coast, South and Midwest </span>+1 (302) 366-4436',
      to: 'tel:13023664436'
    },{
      name: '<span class="text-primary dark:text-gray-600">West Coast </span> +1 (916) 739-2940 (ext 103)',
      to: 'tel:19167392940' 
    },{
      name: '<span class="text-primary dark:text-gray-600">Fax </span> +1 (659)209-3337',
      to: 'tel:16592093337' 
    }],
    menuSecond: [{
      name: 'about',
      to: '/#about'
    },{
      name: 'contacts',
      to: '/#contacts'
    },{
      name: 'request_a_quote',
      to: '/#request_a_quote'
    },{
      name: 'credit_application',
      to: '/#credit_application'
    },{
      name: 'factoring_companies',
      to: '/#factoring_companies'
    }],
    menuRules: [{
      name: 'terms_of_use',
      to: '/#terms_of_use'
    },{
      name: 'terms_and_conditions',
      to: '/#terms_and_conditions'
    },{
      name: 'privacy_policy',
      to: '/#privacy_policy'
    },{
      name: 'cookie_policy',
      to: '/#cookie_policy'
    }],
  }
}