import React from "react";
import { Grid, Container, Header } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";

class ContentPageNotFound extends React.Component {
    render() {
        return (
            <Grid container>
                <Grid.Row centered style={{ padding: "50pt 0 0 0" }}>
                    <Container fluid textAlign="left">
                        <Header as="h2">404: Page not found.</Header>
                        <p>
                            Try going to one of the destinations in the header's
                            menu!
                        </p>
                    </Container>
                </Grid.Row>
            </Grid>
        );
    }
}

export default ContentPageNotFound;
