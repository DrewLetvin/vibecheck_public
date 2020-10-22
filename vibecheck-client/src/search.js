import _ from "lodash";
import React from "react";
import Wordcloud from "wordcloud";
import { Grid, Search, Container, Header } from "semantic-ui-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Brush
} from "recharts";

import "./index.css";
import "semantic-ui-css/semantic.min.css";

const initialSearchState = {
    isLoading: false,
    results: [],
    value: "",
    timeout: 0,
    avg_sentiment: "(mean sentiment score, -1 to +1 inclusive)",
    sentiment_string: "TBD",
    interesting_text: "",
    text_vis: false,
    int_texts: [],
    word_cloud: [],
    word_vis: false,
    sample_index: 0,
    sorted_history: [],
    no_searches_yet: true,
};

class SimpCloud extends React.Component {
    componentDidUpdate() {
        const list = this.props.words;
        Wordcloud(this.refs["my-canvas"], {
            list: list,
            color: "#000000",
            fontFamily: "Tahoma, Geneva, sans-serif",
            drawOutOfBound: false,
        });
    }

    render() {
        if (this.props.word_vis === true) {
            return (
                <>
                    <Container fluid>
                        <Header as="h2">Word Cloud of Analyzed Data</Header>
                    </Container>
                    <div>
                        <div
                            id="html-canvas"
                            ref="my-canvas"
                            style={{
                                width: this.props.words.length * 8,
                                height: this.props.words.length * 8,
                            }}
                        />
                    </div>
                </>
            );
        } else {
            return <div ref="my-canvas" />;
        }
    }
}

class InterestingText extends React.Component {
    render() {
        if (this.props.text_vis) {
            return (
                <Grid container>
                    <Grid.Row style={{ padding: "40pt 0 0 0" }} centered>
                        <button
                            className="ui icon button mini"
                            onClick={this.props.refreshText}
                            style={{ background: "white", padding: "0 0 0 0" }}
                        >
                            <i className="undo icon"></i>
                        </button>
                    </Grid.Row>
                    <Grid.Row
                        fixed="true"
                        centered
                        style={{ padding: "10pt 0 0 0" }}
                    >
                        <div style={{ padding: "0 0 0 5pt" }}>
                            {this.props.int_text}
                        </div>
                    </Grid.Row>
                </Grid>
            );
        } else {
            return (
                <Grid.Row
                    centered
                    style={{ padding: "100pt 0 0 0" }}
                ></Grid.Row>
            );
        }
    }
}
class ContentSearch extends React.Component {
    constructor(props) {
        super(props);
        this.state = initialSearchState;
    }

    handleSearchChange = (e, { value }) => {
        this.setState({ value });
        this.setState({ word_vis: false, word_cloud: [] });

        if (this.timeout) clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            if (this.state.value.length < 1)
                return this.setState(initialSearchState);

            this.getData(value);
        }, 1500);
    };

    render() {
        let historyGraph;
        if (this.state.no_searches_yet) {
            historyGraph = <div></div>;
        } else if (!this.state.valid_date) {
            historyGraph = (
                <>
                    <Grid.Row centered style={{ padding: "50pt 0 0 0" }}>
                        <Container fluid>
                            <Header as="h2">History of Search Term</Header>
                        </Container>
                    </Grid.Row>
                    <Grid.Row centered style={{ padding: "5pt 0 0 0" }}>
                        <BarChart
                            width={500}
                            height={300}
                            data={this.state.sorted_history}
                            margin={{
                                top: 5,
                                right: 40,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <ReferenceLine y={0} stroke="#000" />
                            <Brush
                                dataKey="name"
                                height={30}
                                stroke="#8884d8"
                            />
                            <Bar dataKey="sentiment" fill="#8884d8" />
                        </BarChart>
                    </Grid.Row>
                </>
            );
        }

        return (
            <Grid container>
                <Grid.Row centered style={{ padding: "50pt 0 0 0" }}>
                    <div className="logo">vibecheck</div>
                </Grid.Row>
                <Grid.Row centered style={{ padding: "50pt 0 0 0" }}>
                    <Search
                        className="search-bar"
                        loading={this.state.isLoading}
                        placeholder="what's on your mind?"
                        onSearchChange={_.debounce(
                            this.handleSearchChange,
                            500,
                            { leading: true }
                        )}
                        value={this.state.value}
                        open={false}
                        {...this.props}
                    />
                </Grid.Row>
                <Grid.Row centered style={{ padding: "20pt 0 0 0" }}>
                    <Container fluid>
                        <Header as="h4">{"Sentiment Score: "}</Header>
                        {this.state.avg_sentiment}
                    </Container>
                </Grid.Row>
                <Grid.Row centered style={{ padding: "10pt 0 0 0" }}>
                    <Container fluid>
                        <Header as="h4">{"Vibes: "}</Header>
                        {this.state.sentiment_string}
                    </Container>
                </Grid.Row>
                <Grid.Row centered style={{ padding: "5pt 0 0 0" }}>
                    <InterestingText
                        text_vis={this.state.text_vis}
                        int_text={this.state.interesting_text}
                        refreshText={this.refreshText.bind(this)}
                    />
                </Grid.Row>
                {historyGraph}
                <Grid.Row centered style={{ padding: "50pt 0 0 0" }}>
                    <SimpCloud
                        words={this.state.word_cloud}
                        word_vis={this.state.word_vis}
                    />
                </Grid.Row>
            </Grid>
        );
    }

    getData(search) {
        this.setState({ isLoading: true });
        fetch(
            `/search/${search}/${this.props.options.reddit}/${this.props.options.twitter}/${this.props.options.news}`
        )
            .then((res) => res.json())
            .then((data) => {
                this.setState({ isLoading: false });
                let avg_sent = data.avg_sentiment; //data.avg_sentiment
                let samples = data.sample;
                let sent_string = "neutral";
                if (avg_sent >= 0.05) {
                    sent_string = "positive";
                } else if (avg_sent <= -0.05) {
                    sent_string = "negative";
                }

                let result_objs = [];
                for (const date of data.query_history) {
                    result_objs.push({
                        date: date.substr(0, date.indexOf(".")),
                        sentiment: data.query_history_sentiment[date],
                    });
                }

                this.setState({
                    avg_sentiment: avg_sent,
                    sentiment_string: sent_string,
                    interesting_text: samples[0],
                    text_vis: true,
                    int_texts: samples,
                    word_cloud: data.word_count,
                    word_vis: true,
                    sample_index: 0,
                    sorted_history: result_objs,
                    no_searches_yet: false,
                });
            });
    }
    refreshText() {
        let index = this.state.sample_index + 1;
        if (index >= this.state.int_texts.length) index = 0;
        this.setState({
            interesting_text: this.state.int_texts[index],
            sample_index: index,
        });
    }
}

export default ContentSearch;
