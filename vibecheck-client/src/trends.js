import _ from "lodash";
import React from "react";
import { Grid, Search, Container, Header, List } from "semantic-ui-react";
import {
    BarChart,
    Bar,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Label,
} from "recharts";
import "./index.css";
import "semantic-ui-css/semantic.min.css";

const initialSearchState = {
    isLoading: false,
    results: [],
    value: "",
    timeout: 0,
    sorted_results: [],
    valid_date: false,
    data_for_date: false,
    date_parsed: "",
    no_searches_yet: true,
};

class ContentTrends extends React.Component {
    constructor(props) {
        super(props);
        this.state = initialSearchState;
    }

    handleSearchChange = (e, { value }) => {
        this.setState({ value });

        if (this.timeout) clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            if (this.state.value.length < 1)
                return this.setState(initialSearchState);

            this.getData(value);
        }, 1500);
    };

    displayPopularSearches = () =>
        this.state.sorted_results.map((el) => (
            <List.Item style={{ padding: "10pt 10pt 10pt 10pt" }}>
                <List.Content>
                    <List.Header>
                        {el.query}: searched {el.times_searched} time(s)
                    </List.Header>
                    <List.Description>
                        avg. sentiment: {el.sentiment}
                    </List.Description>
                </List.Content>
            </List.Item>
        ));

    renderTooltip = (props) => {
        const { active, payload } = props;

        if (active && payload && payload.length) {
            const data = payload[0] && payload[0].payload;

            return (
                <div
                    style={{
                        backgroundColor: "#fff",
                        border: "1px solid #999",
                        margin: 0,
                        padding: 10,
                    }}
                >
                    <p>{data.query}</p>
                    <p>
                        <span>times searched: </span>
                        {data.times_searched}
                    </p>
                    <p>
                        <span>avg. sentiment: </span>
                        {data.sentiment}
                    </p>
                </div>
            );
        }

        return null;
    };

    render() {
        let results;

        if (this.state.no_searches_yet) {
            results = <div></div>;
        } else if (!this.state.valid_date) {
            results = (
                <Grid.Row centered style={{ padding: "30pt 0 0 0" }}>
                    <Container fluid>
                        <Header as="h3">
                            That text could not be parsed as a date.
                        </Header>
                    </Container>
                </Grid.Row>
            );
        } else if (!this.state.data_for_date) {
            results = (
                <Grid.Row centered style={{ padding: "30pt 0 0 0" }}>
                    <Container fluid>
                        <Header as="h3">
                            There is no search data for the date you entered.
                        </Header>
                    </Container>
                </Grid.Row>
            );
        } else {
            results = (
                <Grid>
                    <Grid.Row centered style={{ padding: "50pt 0 0 0" }}>
                        <Container fluid>
                            <Header as="h2">
                                Search Data from{" "}
                                {this.state.date_parsed.substr(
                                    0,
                                    this.state.date_parsed.indexOf(" ")
                                )}{" "}
                                UTC
                            </Header>
                        </Container>
                    </Grid.Row>
                    <Grid.Row centered style={{ padding: "10pt 0 0 0" }}>
                        <BarChart
                            width={400}
                            height={400}
                            data={this.state.sorted_results}
                            margin={{
                                top: 5,
                                right: 40,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="query" name="times searched" />
                            <YAxis
                                label={{
                                    value: "times searched",
                                    angle: -90,
                                    position: "insideLeft",
                                }}
                            />
                            <Tooltip />
                            <Bar dataKey="times_searched" fill="#8884d8" />
                        </BarChart>
                    </Grid.Row>
                    <Grid.Row centered style={{ padding: "10pt 0 0 0" }}>
                        <ScatterChart
                            width={400}
                            height={400}
                            margin={{
                                top: 5,
                                right: 40,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid />
                            <XAxis
                                type="number"
                                dataKey="times_searched"
                                name="times searched"
                                label
                            >
                                <Label
                                    value="times searched"
                                    offset={0}
                                    position="insideBottom"
                                />
                            </XAxis>

                            <YAxis
                                type="number"
                                dataKey="sentiment"
                                name="avg. sentiment"
                                label={{
                                    value: "sentiment score",
                                    angle: -90,
                                    position: "insideLeft",
                                }}
                            />

                            <Tooltip
                                cursor={{ strokeDasharray: "3 3" }}
                                wrapperStyle={{ zIndex: 100 }}
                                content={this.renderTooltip}
                            />
                            <Scatter
                                data={this.state.sorted_results}
                                fill="#8884d8"
                            />
                        </ScatterChart>
                    </Grid.Row>
                    <Grid.Row centered style={{ padding: "10pt 0 20pt 0" }}>
                        <List>{this.displayPopularSearches()}</List>
                    </Grid.Row>
                </Grid>
            );
        }

        return (
            <Grid container>
                <Grid.Row centered style={{ padding: "50pt 0 0 0" }}>
                    <div className="trends-title">discover past trends</div>
                </Grid.Row>
                <Grid.Row centered style={{ padding: "50pt 0 0 0" }}>
                    <Search
                        className="search-bar"
                        loading={this.state.isLoading}
                        placeholder="enter a date..."
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
                <Grid.Row centered style={{ padding: "10pt 0 0 0" }}>
                    <div className="logo-small">vibecheck</div>
                </Grid.Row>
                {results}
            </Grid>
        );
    }

    getData(date) {
        this.setState({ isLoading: true });
        fetch(`/trends/${date}`)
            .then((res) => res.json())
            .then((data) => {
                this.setState({ isLoading: false, no_searches_yet: false });

                if (!data.valid_date) {
                    this.setState({
                        valid_date: false,
                        data_for_date: false,
                    });
                } else if (!data.data_for_date) {
                    this.setState({
                        valid_date: true,
                        data_for_date: false,
                    });
                } else {
                    let result_objs = [];
                    for (const search of data.sorted_results) {
                        result_objs.push({
                            query: search,
                            times_searched: data.num_searched[search],
                            sentiment: data.avg_sentiment[search],
                        });
                    }

                    this.setState({
                        valid_date: true,
                        data_for_date: true,
                        sorted_results: result_objs,
                        date_parsed: data.date_parsed,
                    });
                }
            });
    }
}

export default ContentTrends;
