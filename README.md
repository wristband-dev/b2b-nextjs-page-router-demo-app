<div align="center">
  <a href="https://wristband.dev">
    <picture>
      <img src="https://assets.wristband.dev/images/email_branding_logo_v1.png" alt="Github" width="297" height="64">
    </picture>
  </a>
  <p align="center">
    Enterprise-ready auth that is secure by default, truly multi-tenant, and ungated for small businesses.
  </p>
  <p align="center">
    <b>
      <a href="https://wristband.dev">Website</a> •
      <a href="https://wristband.stoplight.io/docs/documentation">Documentation</a>
    </b>
  </p>
</div>

<br/>

---

<br/>

# Invotastic for Business (NextJS, Page Router) -- A multi-tenant demo app

"Invotastic for Business" is a multi-tenant demo app that serves other companies as its customers. This repo utilizes a "Backend Server" OAuth2 client type. The backend server technology here is NextJS, and the router type is the Page Router. It demonstrates both how to protect API routes as well as getServerSideProps() function.
<br>
<br>

**Disclaimer:**
Invotastic for Business is not a real-world application and cannot be used to send invoices to real people.

<br>
<hr />
<br>

## Getting Started

You can start up the Invotastic for Business demo application in a few simple steps.

### 1) Sign up for an Wristband account.

First thing is first: make sure you sign up for an Wristband account at [https://wristband.dev](https://wristband.dev).

### 2) Provision the B2B NextJS Page Router demo application in the Wristband Dashboard.

After your Wristband account is set up, log in to the Wristband dashboard.  Once you land on the home page of the dashboard, click the button labelled "Add Demo App".  Make sure you choose the following options:

- Step 1: App Type - B2B
- Step 2: Subject to Authenticate - Humans
- Step 3: Client Framework - NextJS (Page Router)
- Step 4: Domain Format  - Choosing `Localhost` is fastest to setup. You can alternatively choose `Vanity Domain` if you want a production-like experience on your local machine for tenant-specific vanity domains, but this method will require additional setup.

### 3) Apply your Wristband configuration values to the NextJS server configuration

Upon completing the demo application setup, you will be prompted with values that you should copy into the environment variable configuration for this demo repository, which is located in `.env.local`.  Replace the following values:

- `APPLICATION_DOMAIN`
- `DOMAIN_FORMAT`
- `CLIENT_ID`
- `CLIENT_SECRET`

### 4) Run the application

Make sure you are in the root directory of this repository.

#### Install dependencies

Now install all dependencies:

```npm install```

#### Run the server with "localhost" URLs

The server will start up on `localhost` with port `6001`.

```npm run dev```

You can also build and run the production mode:

```npm run build```

```npm start```

#### Run the application with "vanity domain" URLs

Alternatively, if you choose to use custom domains for the demo app, then the server will start up on `business.invotastic.com` with port `6001`. You can run the following command:

```npm run dev-vanity-domain```

You can also build and run the production mode:

```npm run build```

```npm run start-vanity-domain```

<br>
<hr />
<br>

### How to interact with Invotastic for Business

#### Signup Invotastic Users

Now that Invotastic for Business is up and running, you can sign up your first customer on the Invotastic for Business Signup Page at the following location:

- `http://{application_vanity_domain}/signup`, where `{application_vanity_domain}` should be replaced with the value of the "Application Vanity Domain" value of the Invotastic for Business application (can be found in the Wristband Dashboard by clicking the Application Details side menu of this app).

This signup page is hosted by Wristband.  Completing the signup form will provision both a new tenant with the specified tenant domain name and a new user that is assigned to that tenant.

#### Invotastic Home Page

For reference, the home page of this Inovtastic for Business app can be accessed at the following locations:

- Localhost domain format: [http://localhost:6001/](http://localhost:6001/)
- Vanity domain format: [http://{tenant_domain}.business.invotastic.com:6001/](http://{tenant_domain}.business.invotastic.com:6001/), where `{tenant_domain}` should be replaced with the value of the desired tenant's domain name.

#### Invotastic Application-level Login

Users of Invotastic for Business can access the Invotastic for Business Application-level Login Page at the following location:

- `http://{application_vanity_domain}/login`, where `{application_vanity_domain}` should be replaced with the value of the "Application Vanity Domain" value of the Invotastic for Business application (can be found in the Wristband Dashboard by clicking the Application Details side menu of this app).

This login page is hosted by Wristband.  Here, the user will be prompted to enter their tenant's domain name for which they want to log in to.  Successfully entering the tenant domain name will redirect the user to the tenant-level login page for their specific tenant.

Users also have the option here to execute the Forgot Tenant workflow and entering their email address in order to receive a list of all tenants that they belong to.

#### Invotastic Tenant-level Login

If users wish to directly access the Invotastic Tenant-level Login Page without having to go through the application-level login, they can do so at the following locations:

- Localhost domain format: [http://localhost:6001/api/auth/login?tenant_domain={tenant_domain}](http://localhost:6001/home), where `{tenant_domain}` should be replaced with the value of the desired tenant's domain name.
- Vanity domain format: [http://{tenant_domain}.business.invotastic.com:6001/api/auth/login](http://{tenant_domain}.business.invotastic.com:6001/api/auth/login), where `{tenant_domain}` should be replaced with the value of the desired tenant's domain name.

This login page is hosted by Wristband.  Here, the user will be prompted to enter their credentials in order to login to the application.

### Architecture

The NextJS server is responsible for:

- Storing the client ID and secret.
- Handling the OAuth2 authorization code flow redirections to and from Wristband during user login.
- Creating the application session cookie to be sent back to the browser upon successful login.  The application session cookie contains the access and refresh tokens as well as some basic user info.
- Refreshing the access token if the access token is expired.
- Orchestrating all API calls from the React frontend to both Wristband and the Invotastic backend data store.
- Destroying the application session cookie and revoking the refresh token when a user logs out.

API calls made from React to the NextJS server pass along the application session cookie with every request.  The NextJS server peforms the following actions on all API route handlers and getServerSideProps() function calls:

- Ensuring the user's authenticated session is still there
- Validating and refreshing the access token (if necessary)
- "Touching" the application session cookie

> [!WARNING]
> Due to limitations with NextJS middleware around Node runtimes as well as accessing cookies, middleware is currently not utilized in this demo app.

It is also important to note that Wristband hosts all onboarding workflow pages (signup, login, etc), and NextJS will redirect to Wristband in order to show users those pages.

### Wristband Code Touchpoints

Within the demo app code base, you can search in your IDE of choice for the text `WRISTBAND_TOUCHPOINT`.  This will show the various places in both the React frontend code and NextJS server code where Wristband is involved.  You will find the search results return one of a few possible comments using that search text:

- `/* WRISTBAND_TOUCHPOINT - AUTHENTICATION */` - Code that deals with an authenticated user's application session.  This includes managing their application session cookie and JWTs, OAuth2-related endpoints for login/callback/logout, API routes and SSR pages for validating/refreshing tokens, and React context used to check the user's authenticated session.
- `/* WRISTBAND_TOUCHPOINT - AUTHORIZATION */` - Code that checks whether a user has the required permissions to interact with Invotastic-specific resource APIs or can access certain application functionality in the UI.
- `/* WRISTBAND_TOUCHPOINT - RESOURCE API */` - Code that interacts with any Wristband-specific resource APIs or workflow APIs that are not related to authentication or authorization directly.  For example, it could be an API call to update the user's profile or change their password.

<br>

## Setting up a local DNS when using `VANITY_DOMAIN` for the domain format
<br/>

If you choose to use vanity domains as the domain format for the demo application, you will need to install a local DNS server to provide custom configurations.  This configuration forces any requests made to domains ending with `.business.invotastic.com` to get routed to your localhost.  This configuration is necessary since all vanity domains that get generated when running the demo application locally will have a domain suffix of  `*.business.invotastic.com`. Therefore, the above setting will force those domains to resolve back to your local machine instead of attempting to route them out to the web.

The goal is the following mapping:
`business.invotastic.com` => `127.0.0.1`.


Here are some options which you can use, depending on your operating system:

- Mac / Linux: [dnsmasq](http://mayakron.altervista.org/support/acrylic/Home.htm)
- Windows: [Acrylic](http://mayakron.altervista.org/support/acrylic/Home.htm)

<br/>

## Questions

Reach out to the Wristband team at <support@wristband.dev> for any questions regarding this demo app.

<br/>
