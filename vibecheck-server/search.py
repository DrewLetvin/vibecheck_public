import requests
import praw  # reddit api wrapper
import tweepy
import string
import nltk
import re
import vars
import sys
import os

from newsapi import NewsApiClient
from datetime import date, timedelta
from nltk.corpus import stopwords
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

blocked = {'RT', '@', 'https', '*', '>', '<', '[', ']', '"', '%', 'i', '|',
           'way', 't', 'http', 'post', 's', '’'}  # common things we should filter
# google auth
GOOGLE_API_KEY = vars.GOOGLE_KEY  # pls don't query more than 25 times a day thnx
# https://cse.google.com/cse/setup/basic?cx=014749590020630390210:k5gghnyn2pt
SEARCH = "014749590020630390210:k5gghnyn2pt"

# twitter auth
consumer_key = vars.TWITTER_CONSUMER_KEY
consumer_secret = vars.TWITTER_SECRET_KEY

access_token = vars.ACCESS_TOKEN
access_token_secret = vars.ACCESS_TOKEN_SECRET

# newsapi auth
news_api_key = vars.NEWS_KEY

# dates used for article retrieval
end_date = date.today()
start_date = date.today() - timedelta(days=25)

analyser = SentimentIntensityAnalyzer()
num_datum = 0
sentiment_sum = 0


def interpret_compound_score(score):
    if score >= 0.05:
        return "positive"
    if score <= -.05:
        return "negative"
    return "neutral"


def search_google(query):
    reddit_urls = []  # populated by search
    url = f"https://www.googleapis.com/customsearch/v1?key={GOOGLE_API_KEY}&cx={SEARCH}&q={query}"
    data = requests.get(url).json()
    results = data['items']
    for result in results:
        if "reddit.com/r/" in result['link']:
            reddit_urls.append(result['link'])
    return reddit_urls


def word_count(strings):  # returns a list of tuples [word,freq] O(n) = nlog(n)
    words = {}
    multiwords = {}
    maximum = 0
    stops = stopwords.words('english')
    for s in strings:
        s = s.strip(string.punctuation).lower()
        toked = nltk.word_tokenize(s)
        toked = nltk.pos_tag(toked)
        for word in toked:
            if len(word[0]) < 3 or len(word[0]) > 20:
                continue
            if (word[1] == 'NN' or word[1] == 'NNP' or word[1] == 'ADJ') and word[0] not in blocked:  # noun, adjective
                if word[0] in words:
                    words[word[0]] += 1
                    if words[word[0]] > 15:
                        maximum = max(words[word[0]], maximum)
                        multiwords[word[0]] = words[word[0]]
                else:
                    words[word[0]] = 1

    # return multiwords
    # normalize the size
    return [[a[0], (a[1]*.5) * (200/maximum)] for a in multiwords.items()]


def parse_subreddit(r, reddit_comments, post, hot_flag=True):  # query hot instead of top
    lim = 3  # how many posts to return
    match = re.search('\/r\/(.*?)\/', post)  # only name of subreddit
    subr = match.group(1)
    sub = r.subreddit(subr).top('week', limit=lim)
    print(sub)
    # sub = r.subreddit(subr).hot(limit=lim) if hot_flag else r.subreddit(subr).top(limit=lim)
    for post in sub:
        if len(reddit_comments) >= 1000:
            break

        reddit_comments.append(post.selftext)
        post.comment_sort = "top"
        post.comments.replace_more(limit=0)
        comments = post.comments.list()
        for comment in comments:
            if comment.score > 1:
                reddit_comments.append(comment.body)


def search_reddit(posts):
    reddit_comments = []  # populated by search_reddit
    r = praw.Reddit(client_id=vars.REDDIT_CLIENT_ID,
                    client_secret=vars.REDDIT_CLIENT_SECRET, user_agent="vibecheck")
    if posts:  # nonempty
        for post in posts:
            if len(reddit_comments) >= 1000:
                break
            try:
                postP = r.submission(url=post)
            except:
                try:
                    parse_subreddit(r, reddit_comments, post)
                except:
                    continue
                continue
            postP.comment_sort = "top"
            if postP.is_self:
                reddit_comments.append(postP.selftext)
            postP.comments.replace_more(limit=0)
            comments = postP.comments.list()
            for comment in comments:
                if comment.score > 1:
                    reddit_comments.append(comment.body)
    return reddit_comments


def search_twitter(keyword):
    filter_string = ' -filter:retweets'
    key = f"{keyword}{filter_string}"

    auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
    auth.set_access_token(access_token, access_token_secret)

    api = tweepy.API(auth, wait_on_rate_limit=True,
                     wait_on_rate_limit_notify=True)

    maxTweets = 100  # Lowered to prevent api cooldown
    tweetsPerQuery = 100
    tweetCount = 0

    sinceId = None

    twitter_comments = []

    max_id = -1

    while tweetCount < maxTweets:
        if max_id <= 0:
            if not sinceId:
                tweets = api.search(
                    q=key, count=tweetsPerQuery, tweet_mode='extended')
            else:
                tweets = api.search(q=key, count=tweetsPerQuery,
                                    since_id=sinceId, tweet_mode='extended')
        else:
            if (not sinceId):
                tweets = api.search(q=key, count=tweetsPerQuery, max_id=str(
                    max_id - 1), tweet_mode='extended')
            else:
                tweets = api.search(q=key,
                                    count=tweetsPerQuery,
                                    max_id=str(max_id - 1),
                                    since_id=sinceId,
                                    tweet_mode='extended')
        if(not tweets):
            break
        for tweet in tweets:
            twitter_comments.append(tweet.full_text)
            # print(tweet.full_text + '\n') #for testing purposes
        tweetCount += len(tweets)
        max_id = tweets[-1].id

    return twitter_comments

# merge relevancy and popularity results for better results


def search_all_news(keyword):
    newsapi = NewsApiClient(api_key=news_api_key)
    article_list = []

    all_articles = newsapi.get_everything(q=keyword,
                                          from_param=start_date,
                                          to=end_date,
                                          language='en',
                                          sort_by='popularity',
                                          page=1, page_size=100)

    for article in all_articles['articles']:
        article_list.append(article['description'])
        # print(article['description'] + '\n')

    return article_list


# only gathers breaking/top stories but in more detail
def search_top_news(keyword):
    newsapi = NewsApiClient(api_key=news_api_key)
    article_list = []
    all_articles = newsapi.get_top_headlines(q=keyword,
                                             language='en',
                                             page=1, page_size=100)

    for article in all_articles['articles']:
        article_list.append(article['description'])
        article_list.append(article['content'])
        #print(article['description'] + '\n')

    return article_list


def analyze_text(texts, term):
    interestingText = []  # includes search term and has strong sentiment
    global num_datum, sentiment_sum
    num_datum += len(texts)
    for text in texts:
        compound_sentiment = analyser.polarity_scores(text).get('compound')
        if compound_sentiment > .5 or compound_sentiment < -.5:
            compound_sentiment *= 2
            if term.lower() in text.lower() and len(text) < 1000:
                interestingText.append(text)
        sentiment_sum += compound_sentiment
    if (num_datum != 0):
        return (sentiment_sum / num_datum, interestingText)
    else:
        return "Nothing Found!"
