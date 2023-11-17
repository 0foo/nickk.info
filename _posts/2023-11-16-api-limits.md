---
title: Working around API request limits with bulk IP proxy
date: 2023-11-16 12:06 +0000
tags: networking
layout: article
---

( Note: this is purely for experimentation and learning. Sites rate limit specifically to avoid data collection, becaue their data is propietary and core to their business. Additionally, on smaller sites especially, boundless scraping can DDOS the site or cause expensive resource utilization. Please respect a web site's rate limits. )

Most websites have API request limits __based on IP__ which make scraping or bulk data collection on their sites prohibitive.

Scraping and data collection requires a LOT of requests for each new page of data which would be rather quickly rate limited, slowing down your data collection to unsatisfactory speeds.

So what's the solution?  Send each request through a unique IP! 

There exists companies which specialize in Bulk IP proxying, and have bulk amounts of IP's, which, for a small fee, will let you proxy all of your requests through their network which, if all goes well, should give you unique IP per request goodness.

I found one of these IP providers called IPRoyal.

IPRoyal claims to have a network of 8 million residential IP's!!! 

If this is true and if this works this is extremely awesome. 

I signed up for IPRoyal and forked over the 7 bucks to see what happens.

<!--more-->

<hr class="article-separator-more"/>


To begin, let's run a non-proxied reddit.com query with a curl statment to see how quickly we get rate limited. 

As everyone knows, 200 status code is a successful request and 429 status code is a blocked reqest due to rate limit. 

Let's see if we can get blocked by reddit.

(Note: These are async responses, so the responses are unordered. Had to async these for speed. )
```bash
nick@nick-XPS-9315:~$ for i in {1..1000}; do /bin/bash -c 'curl  -sL -o /dev/null -w "%{http_code} " https://www.reddit.com &'; done;
nick@nick-XPS-9315:~$ 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 200 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 429 200 429 429 429 429 429 429 429 429 429 429 429 429 429 429 200 429 429 200 429 200 200 429 200 200 200 429 200 429 429 200 429 200 200 200 429 429 200 429 200 200 200 429....
```


Rate limited almost immediately LOL! 

<hr class="article-separator-more"/>

So let's try with the IPRoyal network.

So, for 7 bucks IPRoyal gives you 1gig worth of data. 

To use their network you are provided with a hash/url combo which you can configure as a proxy via proxy application or combine for curl.

Now let's try with the IPRoyal proxy. :) (-x being the curl proxy flag)




```bash
IPRoyalProxy="http://<someBigHash>@geo.iproyal.com:12321"
nick@nick-XPS-9315:~$ for i in {1..1000}; do /bin/bash -c "curl  -s -o /dev/null -w \"%{http_code} \" -I -x $IPRoyalProxy -L https://www.reddit.com &"; done;
nick@nick-XPS-9315:~$ 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 000 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 200 .....
```

<br/>
Not a single 429!!  
Now that's cooking with GAS!!!   
IPRoyal is pretty pretty cool.  
In the next post we're going to combine this with some sort of scraper or web spider to try and scrape all of the comment's of a Reddit user.



