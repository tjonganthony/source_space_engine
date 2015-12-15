SourceSpaceEngine::Engine.routes.draw do
  resources :cs1101s, only: [:index]
  match 'assets/*folders/:filename', to: 'cs1101s#assets', via: [:get],
    :constraints => { :filename => /[^\/]+/ }
  match 'storyXML/:filename', to: 'cs1101s#storyXML', via: [:get],
    :constraints => { :filename => /[^\/]+/ }
end
