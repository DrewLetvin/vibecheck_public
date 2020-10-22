import React from "react";
import ReactDOM from "react-dom";
import { Menu, Sticky } from "semantic-ui-react";
import {
    BrowserRouter as Router,
    Switch,
    Route,
    NavLink,
    Redirect,
} from "react-router-dom";
import "semantic-ui-css/semantic.min.css";

import "./index.css";
import ContentSearch from "./search.js";
import ContentTrends from "./trends.js";
import ContentPolicies from "./policies.js";
import ContentPageNotFound from "./pagenotfound.js";

class MainPage extends React.Component {
    constructor(props) {
        //this is now the parent component of HeaderMenu and Search
        super(props);

        this.state = {
            reddit: true,
            twitter: false,
            news: false,
            amount: 1000,
            date: "week",
        };
    }
    updateReddit() {
        this.setState({
            reddit: !this.state.reddit,
        });
    }
    updateTwitter() {
        this.setState({
            twitter: !this.state.twitter,
        });
    }
    updateNews() {
        this.setState({
            news: !this.state.news,
        });
    }

    render() {
        return (
            <Router>
                <div>
                    <HeaderMenu
                        options={this.state}
                        upRed={this.updateReddit.bind(this)}
                        upTwit={this.updateTwitter.bind(this)}
                        upNews={this.updateNews.bind(this)}
                    />
                    <Switch>
                        <Route exact path="/">
                            <ContentSearch options={this.state} />
                        </Route>
                        <Route path="/trends">
                            <ContentTrends />
                        </Route>
                        <Route path="/policies">
                            <ContentPolicies />
                        </Route>
                        <Route path="/404" component={ContentPageNotFound} />
                        <Redirect to="/404" />
                    </Switch>
                </div>
            </Router>
        );
    }
}

class HeaderMenu extends React.Component {
    handleItemClick = (e, { name }) => this.setState({ activeItem: name });

    render() {
        let red = this.props.options.reddit;
        let twit = this.props.options.twitter;
        let all_news = this.props.options.news;
        return (
            <Sticky context={this.contextRef}>
                <Menu>
                    <Menu.Item as={NavLink} exact to="/" name="search">
                        Search
                    </Menu.Item>
                    <Menu.Item as={NavLink} to="/trends" name="trends">
                        Trends
                    </Menu.Item>
                    <Menu.Item className="icon">
                        <div className="ui simple dropdown">
                            <i className="cog icon"></i>
                            <div className="menu">
                                <div
                                    onClick={this.props.upRed}
                                    className="item"
                                >
                                    {" "}
                                    <span
                                        style={{
                                            color: red ? "#000000" : "#aaaaaa",
                                        }}
                                    >
                                        <i className="mini reddit icon" />{" "}
                                        Reddit
                                    </span>{" "}
                                </div>
                                <div
                                    onClick={this.props.upTwit}
                                    className="item"
                                >
                                    {" "}
                                    <span
                                        style={{
                                            color: twit ? "#000000" : "#aaaaaa",
                                        }}
                                    >
                                        <i className="mini twitter icon" />{" "}
                                        Twitter
                                    </span>{" "}
                                </div>
                                <div
                                    onClick={this.props.upNews}
                                    className="item"
                                >
                                    {" "}
                                    <span
                                        style={{
                                            color: all_news
                                                ? "#000000"
                                                : "#aaaaaa",
                                        }}
                                    >
                                        <i className="mini newspaper icon" />{" "}
                                        News
                                    </span>{" "}
                                </div>
                            </div>
                        </div>
                    </Menu.Item>

                    <Menu.Menu position="right">
                        <Menu.Item as={NavLink} to="/policies" name="policies">
                            Warnings and Policies
                        </Menu.Item>
                    </Menu.Menu>
                </Menu>
            </Sticky>
        );
    }
}

ReactDOM.render(<MainPage />, document.getElementById("root"));
