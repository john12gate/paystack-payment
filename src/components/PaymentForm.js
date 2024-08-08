import React, { useState } from 'react';
import axios from 'axios';
import '../assets/css/PaymentForm.css';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';

const PaymentForm = () => {
    const [email, setEmail] = useState('');
    const [domain, setDomain] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [alertVariant, setAlertVariant] = useState(''); // Add state to manage alert variant
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateEmail(email) || !validateDomain(domain) || !validateAmount(amount)) {
            setMessage('Please enter a valid email, domain, and amount');
            setAlertVariant('danger');
            return;
        }

        setLoading(true);
        setMessage('');
        setAlertVariant('');

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/payments`, { email, domain, amount: parseInt(amount) * 100 });
            const { reference } = response.data;
            const handler = window.PaystackPop.setup({
                key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
                email,
                amount: parseInt(amount) * 100,
                ref: reference,
                callback: function (response) {
                    axios.get(`${process.env.REACT_APP_BACKEND_URL}/payments/payment-status?reference=${response.reference}`)
                        .then(res => {
                            if (res.data.status === 'success') {
                                setMessage('Payment successful!');
                                setAlertVariant('success');
                            } else {
                                setMessage('Payment failed!');
                                setAlertVariant('danger');
                            }
                            setLoading(false);
                        })
                        .catch(err => {
                            console.error('Error verifying payment:', err);
                            setMessage('Error verifying payment.');
                            setAlertVariant('danger');
                            setLoading(false);
                        });
                },
                onClose: function () {
                    setMessage('Payment window closed.');
                    setAlertVariant('secondary');
                    setLoading(false);
                }
            });
            handler.openIframe();
        } catch (error) {
            console.error('Error initiating payment:', error);
            setMessage('Error initiating payment.');
            setAlertVariant('danger');
            setLoading(false);
        }
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const validateDomain = (domain) => {
        const re = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/)?$/;
        return re.test(String(domain).toLowerCase());
    };

    const validateAmount = (amount) => {
        return !isNaN(amount) && parseInt(amount) > 0;
    };

    return (
        <Container className="payment-form">
            <Row className="justify-content-md-center">
                <Col md="6">
                    <h2 className="text-center">Paystack Payment</h2>
                    {message && <Alert variant={alertVariant}>{message}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="formEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <br/><br/>

                        <Form.Group controlId="formDomain">
                            <Form.Label>Domain</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter your domain"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <br/><br/>

                        <Form.Group controlId="formAmount">
                            <Form.Label>Amount</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Enter the amount in Naira"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <br/><br/>

                        <Button variant="primary" type="submit" disabled={loading} block>
                            {loading ? 'Processing...' : 'Pay Now'}
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>

    );
};

export default PaymentForm;
