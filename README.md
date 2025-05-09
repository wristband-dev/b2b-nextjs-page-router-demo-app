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
      <a href="https://docs.wristband.dev">Documentation</a>
    </b>
  </p>
</div>

<br/>

---

<br/>

# Wristband Multi-Tenant Demo App for NextJS (Page Router)

This is a multi-tenant demo app that serves other companies as its customers. This repo utilizes a "Backend Server" OAuth2 client type. The backend server technology here is NextJS, and the router type is the Page Router. It demonstrates both how to protect API routes as well as `getServerSideProps()` function.

<br>
<hr />
<br>

## Getting Started

You can start up the demo application in a few simple steps.

### 1) Sign up for an Wristband account.

First thing is first: make sure you sign up for an Wristband account at [https://wristband.dev](https://wristband.dev).

### 2) Provision the B2B NextJS Page Router demo application in the Wristband Dashboard.

After your Wristband account is set up, log in to the Wristband dashboard.  Once you land on the home page of the dashboard, click the button labelled "Add Demo App".  Make sure you choose the following options:

- Step 1: Subject to Authenticate - Humans
- Step 2: Application Framework - NextJS (Page Router)

You can also follow the [Demo App Guide](https://docs.wristband.dev/docs/setting-up-a-demo-app) for more information.

### 3) Apply your Wristband configuration values to the NextJS server configuration

After completing demo app creation, you will be prompted with values that you should use to create environment variables for the C# server. You should see:

- `APPLICATION_VANITY_DOMAIN`
- `CLIENT_ID`
- `CLIENT_SECRET`

Copy those values, then create an environment variable file in the root directory of this project: `.env`. Once created, paste the copied values into this file.

### 4) Install dependencies

Before attempting to run the application, you'll need to install all project dependencies. From the root directory of this repo, run the following to install dependencies:

```bash
npm install
```

### 5) Run the application

The server will start up on `localhost` with port `6001`.

```bash
npm run dev
```

You can also build and run the production mode:

```bash
npm run build
npm start
```

<br>
<hr />
<br>

### How to interact with the demo app

#### Signup Users

Now that the app is up and running, you can sign up your first customer on the Signup Page at the following location:

- `https://{application_vanity_domain}/signup`, where `{application_vanity_domain}` should be replaced with the value of the "Application Vanity Domain" value of the application (can be found in the Wristband Dashboard by clicking the Application Settings side menu of this app).

This signup page is hosted by Wristband.  Completing the signup form will provision both a new tenant with the specified tenant domain name and a new user that is assigned to that tenant.

#### Home Page

For reference, the home page of this app can be accessed at [http://localhost:6001/](http://localhost:6001/).

#### Application-level Login (Tenant Discovery)

Users of the app can access the Application-level Login Page at the following location:

- `https://{application_vanity_domain}/login`, where `{application_vanity_domain}` should be replaced with the value of the "Application Vanity Domain" value of the Invotastic for Business application (can be found in the Wristband Dashboard by clicking the Application Settings side menu of this app).

This login page is hosted by Wristband.  Here, the user will be prompted to enter their tenant's domain name for which they want to log in to.  Successfully entering the tenant domain name will redirect the user to the tenant-level login page for their specific tenant.

Users also have the option here to execute the Forgot Tenant workflow and entering their email address in order to receive a list of all tenants that they belong to.

#### Tenant-level Login

If users wish to directly access their Tenant-level Login Page without having to go through tenant discovery, they can do so at [http://localhost:6001/api/auth/login?tenant_domain={tenant_domain}](http://localhost:6001/home), where `{tenant_domain}` should be replaced with the value of the desired tenant's domain name.

This login page is hosted by Wristband.  Here, the user will be prompted to enter their credentials in order to login to the application.

### Architecture

The NextJS server is responsible for:

- Storing the client ID and secret.
- Handling the OAuth2 authorization code flow redirections to and from Wristband during user login.
- Creating the application session cookie to be sent back to the browser upon successful login.  The application session cookie contains the access and refresh tokens as well as some basic user info.
- Refreshing the access token if the access token is expired.
- Orchestrating all API calls from the React frontend to both Wristband and the Invotastic backend data store.
- Destroying the application session cookie and revoking the refresh token when a user logs out.

API calls made from React to the NextJS server pass along the application session cookie with every request.  The NextJS middleware peforms the following actions on all protected page and API routes:

- Validating the session and refreshing the access token (if necessary)
- Validating the CSRF token

It is also important to note that Wristband hosts all onboarding workflow pages (signup, login, etc), and NextJS will redirect to Wristband in order to show users those pages.

### Wristband Code Touchpoints

Within the demo app code base, you can search in your IDE of choice for the text `WRISTBAND_TOUCHPOINT`.  This will show the various places in both the React frontend code and NextJS server code where Wristband is involved.  You will find the search results return one of a few possible comments using that search text:

- `/* WRISTBAND_TOUCHPOINT - AUTHENTICATION */` - Code that deals with an authenticated user's application session.  This includes managing their application session cookie and JWTs, OAuth2-related endpoints for login/callback/logout, API routes and SSR pages for validating/refreshing tokens, and React context used to check the user's authenticated session.
- `/* WRISTBAND_TOUCHPOINT - AUTHORIZATION */` - Code that checks whether a user has the required permissions to interact with Invotastic-specific resource APIs or can access certain application functionality in the UI.
- `/* WRISTBAND_TOUCHPOINT - RESOURCE API */` - Code that interacts with any Wristband-specific resource APIs or workflow APIs that are not related to authentication or authorization directly.  For example, it could be an API call to update the user's profile or change their password.

<br>

## Wristband NextJS SDK

This demo app is leveraging the [Wristband nextjs-auth SDK](https://github.com/wristband-dev/nextjs-auth) for all authentication interaction in the NextJS server. Refer to that GitHub repository for more information.

<br>

## Wristband React Client Auth SDK

This demo app is leveraging the [Wristband react-client-auth SDK](https://github.com/wristband-dev/react-client-auth) for any authenticated session interaction in the React frontend. Refer to that GitHub repository for more information.

<br/>

## CSRF Protection

Cross-Site Request Forgery (CSRF) is a security vulnerability where attackers exploit a user's authenticated session to perform unauthorized actions on a web application without their knowledge or consent. This demo app is leveraging a technique called the Double Cookie Submit Pattern to mitigate CSRF attacks by employing two cookies: a session cookie for user authentication and a CSRF token cookie containing a unique token. With each request, the CSRF token is included both in the cookie and the request payload, enabling server-side validation to prevent CSRF attacks.

Refer to the [OWASP CSRF Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) for more information about this topic.

> [!WARNING]
> Your own application should take effort to mitigate CSRF attacks in addition to any Wristband authentication, and it is highly recommended to take a similar approach as this demo app to protect against thse types of attacks.

<br/>

## Questions

Reach out to the Wristband team at <support@wristband.dev> for any questions regarding this demo app.

<br/>
