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
      name: '<span class="text-secondary">+1 (916)</span> 398-8398',
      to: 'tel:19163988398'
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