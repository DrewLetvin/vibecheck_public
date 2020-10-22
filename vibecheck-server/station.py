import search as s
from flask import Flask
from flask import request
from flask_sqlalchemy import SQLAlchemy
import datetime
import pickle
import dateparser
import sys

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root@localhost:3306/vibecheck_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


@app.before_first_request
def initial():
    db.create_all()


@app.route('/search/<search>/<reddit>/<twitter>/<news>')
def search_request(search, reddit, twitter, news):

    coms = ['n']
    #tweets = s.search_twitter(search)
    urls = []
    # urls = ["https://www.reddit.com/r/SFGiants/","https://www.reddit.com/r/Politics/"] <-- good way to test if out of searches
    if twitter == "true":
        coms += s.search_twitter(search)
    if reddit == "true":
        urls = s.search_google(search)
        coms += s.search_reddit(urls)
    if news == "true":
        coms += s.search_all_news(search)

    avg_sentiment, sample = s.analyze_text(coms, search)

    comment_length = len(coms)
    sites_searched = [reddit, twitter, news]
    word_count = s.word_count(coms)

    search_db_entry = UserSearch(
        search=search,
        urls=urls,
        avg_sentiment=avg_sentiment,
        word_count=word_count,
        comments=comment_length,
        sites=sites_searched
    )

    db.session.add(search_db_entry)
    db.session.commit()

    query_history = UserSearch.query.filter_by(search=search.strip()).all()
    query_history_sentiment = dict()
    sorted_query_history = []

    for query in query_history:
        query_history_sentiment[query.time] = query.avg_sentiment
        sorted_query_history.append(query.time)

    sorted_query_history = sorted(sorted_query_history)

    output_dict = {
        "urls": urls,
        "avg_sentiment": avg_sentiment,
        "word_count": word_count,
        "comments": comment_length,
        "sample": sample,
        "sites": sites_searched,
        "query_history": sorted_query_history,
        "query_history_sentiment": query_history_sentiment
    }

    return output_dict


@app.route('/trends/<date>')
def trends_date_request(date):
    date_parsed = dateparser.parse(date)
    output_dict = {"valid_date": True, "data_for_date": True, }

    if date_parsed is None:
        output_dict["valid_date"] = False
        output_dict["data_for_date"] = False
        return output_dict

    results = UserSearch.query.filter(
        UserSearch.time.startswith(str(date_parsed).split(' ')[0])).all()

    print(results, file=sys.stderr)
    if not results:
        output_dict["data_for_date"] = False
        return output_dict

    num_searched = dict()
    avg_sentiment = dict()

    for query in results:
        query_text = query.search.strip()
        if query_text not in num_searched:
            num_searched[query_text] = 1
            avg_sentiment[query_text] = query.avg_sentiment
        else:
            num_searched[query_text] += 1
            avg_sentiment[query_text] += query.avg_sentiment

    for search in avg_sentiment:
        avg_sentiment[search] /= num_searched[search]

    sorted_results = []
    for search in sorted(num_searched, key=num_searched.get, reverse=True):
        sorted_results.append(search)

    output_dict = {
        "valid_date": True,
        "data_for_date": True,
        "date_parsed": str(date_parsed),
        "sorted_results": sorted_results,
        "num_searched": num_searched,
        "avg_sentiment": avg_sentiment
    }
    return output_dict


class UserSearch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    search = db.Column(db.String(280), unique=False, nullable=False)
    time = db.Column(db.String(48), nullable=False,
                     default=datetime.datetime.utcnow)
    urls = db.Column(db.PickleType)
    avg_sentiment = db.Column(db.Float, unique=False)
    word_count = db.Column(db.PickleType)
    comments = db.Column(db.Integer, unique=False)
    sites = db.Column(db.PickleType)

    def __repr__(self):
        return '<Search %r>' % self.search
