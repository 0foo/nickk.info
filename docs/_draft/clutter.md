 <!--more-->

<u>Incomplete list of obeservations about CSS</u>  

##  CSS positives
    * Flexbox is awesome generally.
    * Using rem units is cool.
    * `position:fixed` with a div spacer of the same height underneath is a cool way to make a sticky nav bar. 

## CSS frustrations
* Images:
    * Why does an image have to be set to `display:block` to not have a margin at the bottom? 
    * Found it to be a struggle to vertically center an image inside of an inline-block parent container which is inside flexbox element.

* List/Bullets:
    * Why is `margin-left:1rem;` not the default for list items 
    * why is `list-style-position: inside` almost there except that on the newline the text flows under the bullet, instead of indenting.

* code blocks and pre tag
    * Would like the code block background to only expand to the width of the text instead of all across the screen. Needs more research.
    *  This caused me a headache as the pre tag has presets that ignore style rules and break your layout by not shrinking properly.
    * This is the fix:
    * ```css
pre {
    min-width: -webkit-fill-available;
    min-width: -moz-available;
    min-width: stretch;
    max-width: 0;
}
```

* overflow
    * overflow: auto vs overflow: scroll
    * scroll bars break border-radius 
