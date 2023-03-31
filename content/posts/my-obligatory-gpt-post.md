+++
author = "Aiden Vaines"
catagories = ["bash"]
date = 2023-03-29T23:00:00Z
featured = true
image = "/uploads/gpt-robot-horse-1.png"
tags = ["gpt", "openai", "bash", "code"]
title = "My obligatory GTP post"

+++
Seemingly everyone must now have a blog post about using ChatGPT, lets get on that band waggon.

Like everything new, there are people and experts expressing concern, worry and condemnation of ML models. A lot of of which seem to be FUD, but some of it seems valid and up for debate. Personally, my only real worry for our new ML overlords is, if GPT3 has been trained using data from circa 2019 and we all just use it like StackOverflow, who is going to be posting questions on forums for the next iteration of ML to learn from? Are we going to have to go back to finding a post from someone with the exact same problem from years ago without an answer?

[![XKCD Wisdom of the Ancients](https://imgs.xkcd.com/comics/wisdom_of_the_ancients.png)](https://xkcd.com/979/)

I suspect it means the raw number of questions asked in forums dies off, and only the actually complicated or niche questions which services like ChatGPT cannot answer correctly persist. But how does that effect the forums directly? Will that be enough traffic to sustain them through add revenue etc long term? Or will they cease to exist as they are no longer profitable or have a health community presence?

Hot takes aside; I spend most of my time in a terminal and a web browser requires me to use a mouse, this is unacceptable. I need to be able to use this AI to bypass doing any work. When someone asks me a question I'd like to make sure they can't see that I just opened https://chat.openai.com and just asked it the exact same question like a modern https://lmgtfy.app.

To solve my challenge I've added some extra functions to my `.zshrc` (`.bashrc` should work too) file to let me query the OpenAI model directly from my terminal. _If you want to play along at home, you will need `jq`, `viu` and of course `curl` for this to work._

Simply generate an API key from https://platform.openai.com/account/api-keys and update and add this snippet to your `~/.zshrc` or `~/.bashrc` files.

    # ChatGPT Bits
    OPENAI_API_KEY="YOUR_API_KEY_HERE"
    OPENAI_VERSION="gpt-3.5-turbo" #"gpt-4" in future or if you are on the beta
    
    function ask_gpt {
        PROMPT=$(echo ${1}|tr '\n' ' ') # Hack to support for multi-line prompts
        curl https://api.openai.com/v1/chat/completions -s \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -d '{
            "model": "'${OPENAI_VERSION}'",
            "messages": [{"role": "user", "content": "'${PROMPT}'"}],
            "temperature": 0.7
        }' | jq -r '.choices[0].message.content'
    }
    
    function ask_gpt_img {
        IMG_URL=$(curl https://api.openai.com/v1/images/generations -s \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -d '{
            "prompt": "'$1'",
            "n": 1,
            "size": "1024x1024"
        }'| jq -r '.data[0].url')
    
        if [ -n "$2" ]; then
            curl -s $IMG_URL -o "${2}"
        else
            curl -s $IMG_URL | viu -
        fi
    }

Then away we go, are a couple of prompts to get started

`ask_gpt "Generate me a CSV formatted list of 10 stores with addresses' # ask a question"`
`ask_gpt_img "Draw me a picture of a robot on a horse in the style of Botticelli" # to draw a picture and display in terminal using VIU`
`ask_gpt_img "Draw me a picture of a robot on a horse in the style of Caravaggio" my-horse-picture.png # to draw a picture and save it`

I can now query ChatGPT directly from my terminal, pipe the results straight in to files, commit it to git, and call it a day. Job done. I can also use it to generate pictures of robots riding horses. I don't know which has greater value.

![](/uploads/gpt-robot-horse-1.png "A robot riding a horse")

Later on I might make changes to allow me to refine by replying and asking followup questions to the service or in the case of images, asking for variations on a response. It looks like you can [tune the AI response](https://platform.openai.com/docs/api-reference/chat/create) using  things like the temperature of the prompt to alter the deterministic response.