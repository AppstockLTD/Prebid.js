# Overview

```
Module Name: AppStockSSP Bidder Adapter
Module Type: AppStockSSP Bidder Adapter
Maintainer: sdksupport@app-stock.com
```

# Description

One of the easiest way to gain access to AppStockSSP demand sources  - AppStockSSP header bidding adapter.
AppStockSSP header bidding adapter connects with AppStockSSP demand sources to fetch bids for display placements

# Test Parameters
```
    var adUnits = [
                // Will return static test banner
                {
                    code: 'adunit1',
                    mediaTypes: {
                        banner: {
                            sizes: [ [300, 250], [320, 50] ],
                        }
                    },
                    bids: [
                        {
                            bidder: 'appStockSSP',
                            params: {
                                placementId: 'testBanner',
                            }
                        }
                    ]
                },
                {
                    code: 'addunit2',
                    mediaTypes: {
                        video: {
                            playerSize: [ [640, 480] ],
                            context: 'instream',
                            minduration: 5,
                            maxduration: 60,
                        }
                    },
                    bids: [
                        {
                            bidder: 'appStockSSP',
                            params: {
                                placementId: 'testVideo',
                            }
                        }
                    ]
                },
                {
                    code: 'addunit3',
                    mediaTypes: {
                        native: {
                            title: {
                                required: true
                            },
                            body: {
                                required: true
                            },
                            icon: {
                                required: true,
                                size: [64, 64]
                            }
                        }
                    },
                    bids: [
                        {
                            bidder: 'appStockSSP',
                            params: {
                                placementId: 'testNative',
                            }
                        }
                    ]
                }
            ];
```
