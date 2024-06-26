# System requirements
libreevent's system requirements are low, you only need a PC or Server that can run node.js and is able to install npm packages. If the system you are trying to use is unable to download npm packages, you may download the packages on your own system and upload them together with the rest of the server files. How to do that is described in greater detail in the [Getting Started guide](/docs/setup/installation).

## node.js
Your system needs to be able to run node.js V > 16.0 and must have access to either npm or the downloaded npm packages.

## Hardware requirements

Hardware requirements solely depend on the amount of usage it is going to get. A cheap hosting plan should be able to handle about 100 simultaneous people. Failing to meet the CPU recommendation may lead to slow response times when a lot of people try to connect to the server at once. A good way to mitigate this problem is to use cloudflare's DDOS protection or rate limiting feature. Follow their official guide [here](https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/) on how to set it up. Many hosting providers already use Cloudflare and you may have settings for cloudflare already enabled. Otherwise, [create a cloudflare account](https://dash.cloudflare.com/sign-up?lang=en-US) and update your website's DNS records to instead of directly pointing to your webserver to point to Cloudflare's DNS where you can re-add the DNS records that were previously configured in your hosting provider's DNS. For more information see [Security best practices](/docs/setup/security).