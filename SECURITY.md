# Security Configuration for zADE Portal

This document provides security configuration recommendations for deploying the zADE Portal on IBM Liberty for z/OS.

## Content Security Policy (CSP)

The portal is designed to work with a strict Content Security Policy. Add the following CSP header in your Liberty `server.xml`:

```xml
<httpEndpoint id="defaultHttpEndpoint" host="*" httpPort="9080" httpsPort="9443">
  <headers>
    <add>Content-Security-Policy: default-src 'self'; 
         script-src 'self'; 
         style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com; 
         font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; 
         img-src 'self' https://www.ibm.com data:; 
         connect-src 'self' https: http:;
    </add>
  </headers>
</httpEndpoint>
```

**Note:** `connect-src https: http:` is required because the portal uses `fetch()` to poll service endpoints across your homelab.

## Additional Security Headers

Add these headers to enhance security:

```xml
<httpEndpoint id="defaultHttpEndpoint" host="*" httpPort="9080" httpsPort="9443">
  <headers>
    <!-- Content Security Policy (see above) -->
    <add>Content-Security-Policy: ...</add>
    
    <!-- Prevent MIME type sniffing -->
    <add>X-Content-Type-Options: nosniff</add>
    
    <!-- Prevent clickjacking -->
    <add>X-Frame-Options: SAMEORIGIN</add>
    
    <!-- Control referrer information -->
    <add>Referrer-Policy: strict-origin-when-cross-origin</add>
    
    <!-- Enable browser XSS protection -->
    <add>X-XSS-Protection: 1; mode=block</add>
    
    <!-- HTTPS Strict Transport Security (if using HTTPS) -->
    <add>Strict-Transport-Security: max-age=31536000; includeSubDomains</add>
  </headers>
</httpEndpoint>
```

## Alternative: WEB-INF/web.xml Configuration

If you prefer to configure security headers in `WEB-INF/web.xml` instead of `server.xml`, you can use a filter:

```xml
<filter>
  <filter-name>SecurityHeadersFilter</filter-name>
  <filter-class>com.ibm.ws.webcontainer.filter.WebContainerFilter</filter-class>
  <init-param>
    <param-name>Content-Security-Policy</param-name>
    <param-value>default-src 'self'; script-src 'self'; style-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' https://www.ibm.com data:; connect-src 'self' https: http:;</param-value>
  </init-param>
  <init-param>
    <param-name>X-Content-Type-Options</param-name>
    <param-value>nosniff</param-value>
  </init-param>
  <init-param>
    <param-name>X-Frame-Options</param-name>
    <param-value>SAMEORIGIN</param-value>
  </init-param>
  <init-param>
    <param-name>Referrer-Policy</param-name>
    <param-value>strict-origin-when-cross-origin</param-value>
  </init-param>
</filter>

<filter-mapping>
  <filter-name>SecurityHeadersFilter</filter-name>
  <url-pattern>/*</url-pattern>
</filter-mapping>
```

## CDN Resource Integrity

The portal includes Subresource Integrity (SRI) hashes for CDN resources in `index.html`:

- **Font Awesome 6.5.0**: SRI hash included
- **Google Fonts**: SRI not applicable (dynamic CSS generation)

If you update Font Awesome, regenerate the SRI hash:

```bash
# Generate SRI hash for a CDN resource
curl -s https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css | \
  openssl dgst -sha512 -binary | \
  openssl base64 -A
```

## Air-Gapped Deployment

For air-gapped z/OS environments without internet access:

1. **Self-host Font Awesome:**
   - Download from https://fontawesome.com/download
   - Place in `assets/fonts/fontawesome/`
   - Update `index.html` to reference local files

2. **Self-host IBM Plex fonts:**
   - Download from https://github.com/IBM/plex/releases
   - Place in `assets/fonts/ibm-plex/`
   - Add `@font-face` rules to `assets/css/main.css`

3. **Remove external favicon:**
   - Already using local SVG favicon (no external dependency)

## HTTPS Configuration

The portal is designed for HTTPS deployment. Ensure your Liberty server has:

1. **SSL/TLS certificate configured** in `server.xml`
2. **HTTP to HTTPS redirect** (optional but recommended)
3. **Strong cipher suites** enabled

Example Liberty SSL configuration:

```xml
<keyStore id="defaultKeyStore" password="{xor}..." />

<ssl id="defaultSSLConfig" keyStoreRef="defaultKeyStore" 
     sslProtocol="TLSv1.2" 
     enabledCiphers="TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256" />
```

## Authentication

The portal itself does not implement authentication. It relies on:

1. **Network-level security** (firewall, VPN)
2. **Service-level authentication** (each linked service has its own auth)
3. **Liberty security** (optional - can add form-based or basic auth)

To add Liberty authentication, update `WEB-INF/web.xml`:

```xml
<security-constraint>
  <web-resource-collection>
    <web-resource-name>Protected Area</web-resource-name>
    <url-pattern>/*</url-pattern>
  </web-resource-collection>
  <auth-constraint>
    <role-name>users</role-name>
  </auth-constraint>
</security-constraint>

<login-config>
  <auth-method>FORM</auth-method>
  <form-login-config>
    <form-login-page>/login.html</form-login-page>
    <form-error-page>/login-error.html</form-error-page>
  </form-login-config>
</login-config>

<security-role>
  <role-name>users</role-name>
</security-role>
```

## Security Checklist

- [ ] CSP headers configured in Liberty
- [ ] Additional security headers enabled
- [ ] HTTPS configured with valid certificate
- [ ] Strong TLS protocols and ciphers enabled
- [ ] SRI hashes verified for CDN resources
- [ ] WAR transferred in binary mode (prevents corruption)
- [ ] Service endpoints use HTTPS where possible
- [ ] Regular security updates for Liberty and z/OS
- [ ] Access logs enabled and monitored
- [ ] Network firewall rules configured

## Monitoring and Logging

Enable Liberty access logging to monitor portal usage:

```xml
<httpEndpoint id="defaultHttpEndpoint" host="*" httpPort="9080" httpsPort="9443">
  <accessLogging filepath="${server.output.dir}/logs/http_access.log" 
                 logFormat='%h %u %t "%r" %s %b "%{Referer}i" "%{User-Agent}i"' />
</httpEndpoint>
```

## Vulnerability Disclosure

If you discover a security vulnerability in the zADE Portal, please report it to the maintainer via GitHub issues or email.

## References

- [IBM Liberty Security Documentation](https://www.ibm.com/docs/en/was-liberty/base?topic=liberty-securing)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)