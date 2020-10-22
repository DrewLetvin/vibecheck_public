# VIBECHECK

## Requirements:

Make sure to have installed Yarn before proceeding

To do this:

Run `brew install yarn`,

Run `choco install yarn`,

or visit https://classic.yarnpkg.com/en/docs/install/#windows-stable

There are two parts to this repository: a React web app in `/vibecheck-client` and a Flask web server in `/vibecheck-server`.

### MySQL Database

By default, the Flask server is set up to work with a database that's locally hosted and accessed with a passwordless root account. If you'd like to change this, edit the URI that is assigned to `app.config['SQLALCHEMY_DATABASE_URI']` in `station.py`.

Additionally, you can add a password to the root account if you'd like. Just keep in mind that you'll have to add `:[PASSWORD]`
after the username in the MySQL URI.

First, install MySQL on your computer if you don't have it.

macOS: `brew install mysql`
Windows: `choco install mysql`

Both of these sources set the root account of the locally-hosted MySQL server to be passwordless by default.

Now, start up a local MySQL server with `mysql.server start` or `"C:\Program Files\MySQL\MySQL Server 5.7\bin\vibecheck_db"` if using Powershell. On the first run of this server, you'll need to follow some
extra steps. Otherwise, you're done! You can stop the server with `mysql.server stop` or move forward with starting the Flask server.

If this is the first time the MySQL server's been run, you'll want to run `mysql -u root` to access the MySQL monitor. Then,
run the instruction `CREATE DATABASE vibecheck_db;`, semicolon and upper/lower case included.

Now that the database has been created, run `exit`. The server will still be runnning and you can now start the Flask server.

### Web Server

First, `cd` into `vibecheck/vibecheck-server`; then set up the Python virtual environment with `python3 -m venv venv`.

Then, launch the virtual environment:

For Mac: `source venv/bin/activate`  

For Windows: `source venv/Scripts/activate` (Git Bash) or `.\venv\Scripts\activate` (cmd)

While the venv is active, run `pip install -r requirements.txt`
and to get the required NLTK modules run `python -m nltk.downloader stopwords punkt averaged_perceptron_tagger`

Run `pip install python-dotenv` to include the .flaskenv/.env files.

You should also set the environmental variable FLASK_APP to `station.py`

`export FLASK_APP=station.py` (in Bash)
`$env:FLASK_APP = "station.py"` (in Powershell)

Run `yarn start-api` to start flask localhost on Windows  
Run `yarn start-api-m` to start flask localhost on Mac

_If you need to add a new dependency, run `pip install [module]` and then run `pip freeze > requirements.txt`._

### React App
In a new terminal window:

To be able to run the React web app, you need to have `npm` installed (included with Node.js).

First, `cd` into `vibecheck/vibecheck-client`.

Run `npm install`.

Then, run `yarn start` to start the react localhost.

_If you need to add a new dependency, run `npm install [module] --save`_
