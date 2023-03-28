# W12D2
# Full Stack Authentication

## Learning Objectives
- Describe a session based auth scheme
- Build a Rails + React/Redux app, complete w user auth

## Agenda
- Session Based Authentication
    - `sessionStorage` object
- Long Demo
    - Setup Backend
    - Review and build Backend Auth
    - Setup Frontend to store and verify the session for all HTTP requests
    - Create session actions and reducer

## Session Based Authentication
1. You attempt to log in using your credentials
2. Your login credentials are verified, and the server creates a session with a session ID for you. This session is stored in the database
3. Your session ID is stored in your browser (client) as a cookie
4. Upon subsequent requests, your cookie is verified against the session ID stored in the server. If it's a match the request is considered valid and processed
5. If you log out of an application, the session ID is destroyed on both the client and the server sides.

## The `sessionStorage` object
- A `Storage` object that can be used to access a browser's current session storage space
    - Each tab has it's own session storage space
- Data in `sessionStorage` expires when a page's session ends
    - i.e. when a tab or browser is closed, the corresponding `sessionStorage` gets cleared
- Basic Usage
    - `sessionStorage.setItem("key", "value")` => save data
    - `sessionStorage.getItem("key")` => retrieve data
    - `sessionStorage.removeItem("key")` => remove data
    - `sessionStorage.clear()` => remove all data from `sessionStorage`

## To Do List
1. Configure backend to:
    - Manage session cookies
    - Transform keys in Jbuilder and `params`
    - Use CSRF protection
    - Handle authentication errors
2. On the frontend:
    - Add CSRF headers to all outgoing AJAX/fetch requests
    - Create session actions and reducer


## Demo

- TeaTime Setup Steps for backend
    - Need BCrypt for password digest
    - Need middleware cookie use
    - Jbuilder formatter from camelcase to uppercase

    - **Application Controller**
        - snake_case_params
            - takes in method name and converts them to snake_case before any action runs
        - protect from forgery
        - Attach_authenticity_token is basically the same as form_authenticity_token


    - **Migrations**
        - Password digest is a hashed version of our password. We do this because we don't want to store our actual password into our database
        - Session token is how you know that a user is logged in or not
            - Session token should be unique because we only want one user to be logged in at the same time
    - **Models**
        - has_secure_password
            - includes password setter/getter and also gives us an `authenticate` method
        - ensure_session_token
            ```ruby
                before_validation :ensure_session_token

                def ensure_session_token
                    self.session_token ||= generate_unique_session_token
                end
            ```
        - generate_unique_session_token
            ```ruby
                private

                def generate_unique_session_token
                    while true
                        token = SecureRandom.urlsafe_base64
                        return token unless User.exists?(session_token: token)
                    end
                end
            ```
        - def reset_session_token!
            ```ruby
                def reset_session_token!
                    self.session_token = generate_unique_session_token
                    self.save! # difference between update and save, update will only save whatever it saves as an argument. Save will update all changes across the board
                    session_token
                end
            ```

        - validations
            ```ruby
                validates :username, presence: true
                validates :password, length: { minimum: 6}, allow_nil: true
            ```
        - find_by_credentials
            ```ruby
                def self.find_by_credentials(username, password)
                    user = User.find_by(username: username)
                    if user&.authenticate(password) # user && user.authenticate(password)
                        return user
                    else
                        return nil
                    end
                
                end
            ```
    - At this point, seed your database and check your validations against it in your rails console (rails c)
        - Your password_digest and session_token should be filtered at this point
    - **Application Controller**
        - CRULL
        - `current_user`
            ```ruby
                def current_user
                    @current_user ||= User.find_by(session_token: session[:session_token])
                    # we are using an instance variable right now so that we can access this user in our views (jbuilder)
                end
            ```
        - `require_logged_in`
            ```ruby
                def require_logged_in
                    if !logged_in?
                        render json: { errors: ['Must be logged in']}, status: :unauthorized
                        # this status: :unauthorized will return proper status errors
                        # we are rendering json because rails is only acting as an api for us
                    end
                end

            ```
        - `require_logged_out`
            ```ruby
                def require_logged_out
                    if logged_in?
                        render json: { errors: ['Must be logged out']}, status: :403
                    end
                end
            ```

        - `logged_in?`
            ```ruby
                def logged_in?
                    !!current_user
                end
            ```
        - `login(user)`
            ```ruby
                def login(user)
                    session[:session_token] = user.reset_session_token!
                    @current_user = user
                end
            ```
        - `logout`
            ```ruby
                def logout
                    current_user.reset_session_token!
                    session[:session_token] = nil 
                    #clean up our session storage and this makes it more secure
                    @current_user = nil
                end

            ```

        - make sure that our `:snake_case_params, :attach_authenticity_token` are private methods
        - `helper_method` is not necessary now
    
    - **Routes**
        ```ruby 
            namespace :api, defaults: {format: :json} do
                resources :teas, only: [:index, :create,:show]
                resources :users, only: [:create]
                resource :session, only: [:create, :destroy, :show]
            end
        ```
        
    - **Controllers**
        - `rails g controller api/users`
            - this nests the controller under the api folder
        - **users_controller**
            - `user_params`
                ```ruby
                    private

                    def user_params
                        params.require(:user).permit(:username, :password)
                    end

                    ## user: { username: 'bob', password: 'bobobo' }

                    
                ```
            - use a helper method that creates the structure in the comment above for better optimization
            - `wrap_parameters`
                ```ruby
                    wrap_parameters include: User.attribute_names + ['password']
                    #problem users table doesn't have a column name of password
                    # fix this by adding an array of password
                    #takes all of those column names and nest them under an outer key of users
                ```

            - `create`
                ```ruby
                    def create
                        @user = User.new(user_params)
                        if @user.save
                            login(@user)
                            render :show #jbuilder for users
                        else
                            render json: @user.errors.full_messages, status: 422
                        end
                    end
                ```
            
            - `before_action`
                ```ruby
                    before_action :require_logged_out, only:[:craete]
                ```

    - At this point **signup** is complete`
    - Now to develop our views

    - **Users Show Page**
        - app/views/api/users/show.json.jbuilder
        ```ruby
            json.user do #this user is the outer key of user
                json.extract! @user, :id, :username, :created_at
            end

            #user: {id, username, created_at}
        ```

    - **Sessions Controller**
        - rails g controller api/sessions
        - This is where we handle login and logout actions

        - `show`
            ```ruby
                def show
                    @user = current_user
                    if @user
                        render 'api/users/show'
                        #rendering users show page from our session
                    else
                        render json: { user: nil }
                        #we want to send the key of users because our frontend will key into this
                        #on the frontend, we want to be able to grab that user
                        #if we have a logged in user, we want to send that user to the front end which is what we're doing in our show.jbuilder
                        # by us doing user: nil, we're sticking to the same format so that we're either returning an object or nil to the user key
                    end
                end

            ```

        - `create`
            ```ruby
                def create
                    username = params[:username]
                    password = params[:password]
                    @user = User.find_by_credentials(username, password)

                    if @user
                        login!(@user)
                        render 'api/users/show'
                    else
                        render json: { errors: ['Invalid credentials']}
                    end
                end
            ```
        - `destroy`
            ```ruby
                def destroy
                    logout
                    head :no_content
                    # this makes it so there's nothing that's sent back as a response
                end
            ```
        - make sure to include our `before_action`s
            ```ruby
                before_action :require_logged_out, only: [:create]
                before_action :require_logged_in, only: [:destroy]
            ```

        - time to test these out
            - make some requests from the console
            - run your rails server and npm start
            - in your front end

        - How to debug
            - Check console first
            - Check servers
            - In this example we aren't handling CSRF
                - Check who's logged in
                    ```js
                        fetch('api/session').then(res => res.json())
                        .then((data) => console.log(data)) 
                        //json is converting the response into a POJO
                    ```
                    - want to be able to grab the CSRF token
                        - comes with every request we make
                        ```js
                            const res = await fetch('api/session')
                            res.headers.get('X-CSRF-Token')
                            //this gives us our CSRF Token
                        ```
                    - we are getting the CSRF token to test login where we pass the CSRF token as one of the headers
                    - logging in
                        ```js
                            fetch('api/session', {
                                method: "POST",
                                body: JSON.stringify({username: 'madz', password: 'banana'}),
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-Token': 'CSRF-TOKEN VALUE HERE'
                                }
                            })
                        ```
                        - While the promise is rendering here, we can see through our rails server that the user was successfully logged in
                        - We needed to do this whole thing because currently we dont have frontend auth
                            - Once our frontend is developed, we'll be able to handle CSRF
                        
                    - loggin out
                        - same thing except we change our method to "DELETE"
                        - check by fetching the session
    - **BackEnd Done and FrontEnd Start**
        - Want to be able to grab that current user if it exists
        - Create new file in the frontend store called CSRF.js
        - `restoreSession`
            - this is a helper method that handles the CSRF token and who the current user is
            ```js
                export const restoreSession = async () => {
                    let res = await fetch('/api/session');
                    let token = res.headers.get('X-CSRF-Token');
                    // we need this CSRF-token to send along with all of our requests going forward
                    //store it in our sessionStorage
                    sessionStorage.setItem('X-CSRF-Token', token)
                    let data = await res.json();
                    //save current user to sessionStorage
                    sessionStorage.setItem('currentUser', JSON.stringify(data.user))
                    //we are doing data.user because our user is nested in our show.jbuilder
                    //we're converting it back to json (JSON.stringify) because we're adding it into our Storage
                }

            ```
                        
            - We can see what our current user/ CSRF token is by looking at our browser console
                - Click on application and then you can see that in the sidebar when you click on session storage
                - To check if a current user is logged in, invoke restoreSession and then check application in your console

        - We want to grab the current user before any of our DOM content loads
            - Restructure index.js 
            - We first grab our current user and then render everything in our DOM
            ```js

                //make our render method into a const
                const initializeApp = () => {
                    ReactDOM.render(
                        <React.StrictMode>
                            <Provider store={store}>
                                <App/>
                            </Provider>
                        </React.StrictMode>
                        document.getElementById('root')
                    )
                }

                restoreSession().then(initializeApp)
                
                //this will first grab the current user and CSRF token and then render the app
                //the CSRF token will change whenever we refresh/leave the page
                //.then() takes in a callback and invokes it
                //another way to write the .then:
                    // .then(() => initializeApp())

            ```
    - CSRF.js
        - `csrfFetch`
        - Defining a custom fetch to make our code dry
        - It is calling a fetch while setting all of the options for us
        - Any time we're making a fetch in our front end we will use csrfFetch
            - This just makes it so that we dont have to rewrite our headers every single time we fetch and makes it more dynamic
        
        ```js
        
        export const csrfFetch = async(url, options = {}) => {
            options.method ||= 'GET'
            option.headers ||= {};

            if (options.method.toUpperCase() !== 'GET') {
                options.headers['Content-Type'] = 'application.json'
                options.headers['X-CSRF-Token'] = sessionStorage.getItem('X-CSRF-Token')
            }

            const res = await fetch(url, options);
            return res;

        }

        ```
        - **Any time we are changing the database, we need a CSRF Token**

        - Altering the fetch methods in different files now
        ```js
            export const postTea = (tea) => {
                return csrfFetch('api/teas', {
                    method: 'POST',
                    body: JSON.stringify(tea)
                })
            }

        ```
        
        - **Creating Users Reducer**
            - Create usersReducer.js in your store directory

            ```js

            // ACTION TYPES
            const RECEIVE_USER = 'users/RECEIVE_USER';
            const REMOVE_USER = 'users/REMOVE_USER';

            //ACTION CREATORS
            export const receiveUser = user => ({
                type: RECEIVE_USER,
                payload: user
            });
            // receiving a user will be done by the user object itself while removing one will be done through a user's ID
            export const removeUser = userId => {
                type: REMOVE_USER,
                userId
            }


            const usersReducer = (state = {}, action) {
                const nextState = {...state} //shallow copy of previous state

                switch(action.type) {
                    case RECEIVE_USER:
                        nextState[action.payload.id] = action.payload;
                        return nextState;
                    case REMOVE_USER: 
                        delete nextState[action.userId];
                        return nextState;
                    default: 
                    return state;

                }
            }

            export default usersReducer

            ```

            - we utilize this usersReducer through the rootReducer

            ```js
            //store.index.js

            const rootReducer = combineReducers({
                teas: teaReducer,
                transactions: transactionReducer
            })

            //src.index.js

            // we want to populate our initialState with our currentUser
            
            const initializeApp = () => {
                    let currentUser = JSON.parse(sessionStorage.getItem('currentUser'))
                    //grabbing current user that lives in sessionStorage
                    let initialState = {};
                    
                    //we want to structure our initialState properly because users are just a slice of state
                    //want users to point to the current user that we start with
                    //we dont have entities here because we aren't using modals
                    if (currentUser) {
                        initialState = {
                            users: {
                                [currentUser.id]: currentUser
                                //whenever we want to run javascript code in objects, we need to wrap our code in []
                            }
                        }
                    }

                    const store = configureStore(initialState)
                    //this is where we utilize our initialState

                    ReactDOM.render(
                        <React.StrictMode>
                            <Provider store={store}>
                                <App/>
                            </Provider>
                        </React.StrictMode>
                        document.getElementById('root')
                    )
                }

            ```

    - Create thunk Action Creators
        ```js 
            //userReducer.js

            //login thunk action creators

            export const loginUser = user => async dispatch => {
                const res = await csrfFetch('api/session', {
                    method: 'POST',
                    body: JSON.stringify(user)
                });
                let data = await res.json();
                sessionStorage.setItem('currentUser', JSON.stringify(data.user))
                dispatch(receiveUser(data.user)); 
                //user info is nested inside data which is why we have to do data.user
            }

            export const logoutUser = userId => async dispatch => {
                const res = await csrfFetch('api/session', {
                    method: 'DELETE'
                })
                sessionStorage.setItem('currentUser', null)
                dispatch(removeUser(userId));
            }

            export const createUser = user => async dispatch => {
                const res = await csrfFetch('api/users', {
                    method: 'POST',
                    body: JSON.stringify(user)
                });

                let data = await res.json();
                sessionStorage.setItem('currentUser', JSON.stringify(data.user));
                dispatch(receiveUser(data.user))
            }

        ```


    **How to test on the console properly**
    ```js
        window.variableName = variableName
        //this enables us to test things through the browser console

    ```
