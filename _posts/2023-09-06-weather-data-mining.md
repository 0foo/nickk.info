---
layout: article
title: Weather Data Mining
date: 2023-09-06 12:16 +0000
image: noaa.jpeg
excerpt_separator: <!--more-->
---


In order to find places to live or visit where I can maximize the amount of time I'm able to comfortably spend outside I wrote a script to calculate the locations in the US with temperatures between 30 degrees and 75 degrees for 6 months or more.
<br/><br/>

* All the data comes from NOAA weather stations and can be downloaded here: [link](https://www.ncei.noaa.gov/pub/data/ghcn/daily/)
* The github repo is here: [https://github.com/0foo/weather_mining](https://github.com/0foo/weather_mining)
* The google map is here: [link](https://www.google.com/maps/d/edit?mid=11qYJOQ2cX9j3T-x5UO5ykXmjUToSdEs&ll=42.70028862623725%2C-119.24163318010127&z=7)
<br/><br/>


 <!--more-->


<u>Interesting observations:</u>

* Looks like the crown for perfect temps year round goes to the Pacific Northwest including northern California, Oregon, and Washington.  Many locations there have perfect temps 12 months out of the year.

* The entire West coast fared really well with most of it experiencing comfortable temps most of the year with a few months slightly deviating into cold or hot.

* There's a swath of the southeastern part of the country that has more than 6 months of comfortable temps that curves up the east coast, however almost all of the east/southeast locations cap out at 7 or 8 months of comfortable temps, which doesn't reach west coast comfort levels of 8+ months typically. 

<br/>

<u>To Do </u>
* At some point would like to convert this to a dynamic site where you can plot migraiton patterns to stay in comfortable weather for traveling retired or digital nomad people. 
* Would like to be able to dynamically input your own custom comfortable temp ranges as peoples idea of comfortable temps may vary.
* At some point would like toinclude other weather factors like sunshine, preciptation, snowfall

<br/>
![Comfortable](/images/comfort.png)
