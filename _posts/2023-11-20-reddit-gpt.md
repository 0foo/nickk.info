---
title: Scraping all of a users comments in Reddit and uploading to chatgpt
date: 2023-11-20 12:00 +0000
tags: software, scraping, gpt
layout: article
---

I wrote a reddit comment scraper and then uploaded the results of the user comment scraping to ChatGPT4 to see what I could learn about the user.


* Code/Files in this experiment:
    * [https://github.com/0foo/reddit_comment_scraper/tree/master](https://github.com/0foo/reddit_comment_scraper/tree/master)
    * [https://github.com/0foo/reddit_comment_scraper/blob/master/data/spez.txt](https://github.com/0foo/reddit_comment_scraper/blob/master/data/spez.txt)

<br/>


<u> Chating with GPT </u>

```
(uploaded file spez.txt)
Me: Please analyze this file and give me a summary of the person.
```

<!--more-->


```
ChatGPT: The file "spez.txt" contains a series of Reddit comments attributed to the user 'spez'. These comments cover various topics related to Reddit's operations and policies. The comments reflect responses to concerns about changes to Reddit's API, moderation tools, the impact of large language models like ChatGPT on Reddit, content moderation challenges, and other platform-related issues.

The person, 'spez', appears to be highly involved in Reddit's strategic decisions and community engagement. The comments indicate a focus on balancing the needs of Reddit's business model with community concerns, addressing content moderation, and evolving the platform's features and tools. The responses suggest a nuanced understanding of Reddit's ecosystem, including its volunteer moderators, third-party applications, and overall user experience.
```

```
Me: Can you tell me who spez might be
```

```
Chat GPT: 'spez' is the username of Steve Huffman, the co-founder and CEO of Reddit. Huffman, along with Alexis Ohanian, started Reddit in 2005, and 'spez' has been his username on the platform since its inception. As CEO, Huffman is deeply involved in the strategic and operational aspects of the website, often engaging with the Reddit community directly through his user account 'spez'.
```

```
Me: give me a detailed summary of spez with as many specific examples as you can
```

```
Chat GPT: Certainly, here are specific examples from the "spez.txt" file that showcase Steve Huffman's (spez) engagement and responses on Reddit:
    * Addressing API Changes: Spez discusses the impact and reasoning behind changes to Reddit's API, likely reflecting on how these changes affect third-party applications and the developer community.
    * Moderation Tools: He comments on the development and improvement of moderation tools, indicating an ongoing effort to support the volunteer moderators who play a crucial role in Reddit's community management.
    * Content Moderation: Huffman's comments touch upon the challenges of content moderation on Reddit, showing his involvement in dealing with complex issues like hate speech, misinformation, and user behavior.
    * Community Engagement: The comments include responses to user queries and concerns, illustrating Huffman's direct engagement with the Reddit community and his efforts to address their issues.

These examples from the file demonstrate Huffman's active role in guiding Reddit's policies and interacting with its user base, focusing on platform improvement and community relations.
```

```
Me: what does spez say about the changes to the reddit api according to this file. be specific with examples
```

```
Chat GPT: In the file "spez.txt", 'spez' (Steve Huffman) addresses concerns about changes to Reddit's API with specific examples:
* In response to the abrupt announcement of API changes, he acknowledges the tight timeline and mentions ongoing discussions with developers who want to continue working with Reddit​
* He addresses concerns about the impact of API changes on the blind community and the visually impaired, emphasizing the commitment to keep content accessible and working with apps like RedReader and Dystopia to ensure they can continue to access the Data API​
* Spez discusses re-enabling pushshift for mod use cases and ensuring non-commercial, accessibility-focused apps have free access to the Data API​
* He confirms that the API is not going away and is part of the web redesign plan​.
These comments reflect Huffman's efforts to balance Reddit's operational needs with the concerns of its developer and user communities.
```


```
Me: Can you give me a list of comments where spez curses
```

```
Chat GPT: Here is a summary of comments from the file "spez.txt" where the user 'spez' uses cursing language:

"f**k you spez, you lying piece of s**t"​
"I've evolved from a Trickster to a Timid Piece of S**t"​
"Go ahead and send your goons to ban me, a**hole"​
"F**k u/Spez"​
"Why the f**k is /r/The_Donald still around"​
"/r/redesign is going to be biased as f**k"​
"when the f**k is the Reddit search engine being overhauled"​
"Can the web version in mobile f**k off with reverting back"​
"They can't possibly f**k this up that badly"​
"We don't feel like there's a community element in /r/announcements, so we'll take all the s**t we usually get and spray it around every other sub instead"​
"Yeah, you don't give the slightest s**t about user privacy"​
```

```
Me: the comment_parent field is not spez
```


```
Chat GPT: I apologize for the oversight. The comments I listed previously are not directly from 'spez' but are from the comment_parent field in the provided file, which represents responses or comments from other users directed towards or mentioning 'spez'. For an accurate summary of comments where 'spez' himself uses cursing language, I would need to analyze the comment_text field specifically attributed to 'spez'. Let me re-examine the file with this correct focus.
```


```
Me: please re-examine
```

```
Chat GPT: After re-examining the file, it appears that there are no direct instances where 'spez' (Steve Huffman) uses cursing language in his comments. The previous excerpts I provided were from the comment_parent field, which represents comments directed towards or about 'spez', not comments made by 'spez' himself.

If you need any more specific information from the file or have other inquiries, feel free to ask!
```

```
Me: can you list all of the fields in this file
```

```
Chat GPT: The fields in the "spez.txt" file, based on the structure of the comments, are as follows:

    comment_title: The title of the Reddit post or thread where the comment was made.
    comment_text: The actual text of the comment made by 'spez'.
    comment_id: The unique identifier for the comment on Reddit.
    comment_context_link: The URL to the specific comment on Reddit, providing context for where the comment appears.
    comment_parent: The text of the parent comment or post to which 'spez' is responding, if applicable.

These fields collectively provide a structured view of each comment, its context, and its location within the Reddit platform.
```


The most interesting aspect in my opinion is the ability to recognize fields once prompted with zero assistance and learn about them for future actions. 

I noticed it was limited to the examples it could provide, I assuming that's because the text is so large and it has a limited context. 
This weakens it for large scale information analysis in my opinion....at the moment.
Open AI parnering with Microsoft gives them massive GPU farms which will be interesting to see how this grows. 
