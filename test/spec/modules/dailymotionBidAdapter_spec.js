import { config } from 'src/config.js';
import { expect } from 'chai';
import { spec } from 'modules/dailymotionBidAdapter.js';
import { BANNER, VIDEO } from '../../../src/mediaTypes.js';

describe('dailymotionBidAdapterTests', () => {
  // Validate that isBidRequestValid only validates requests with apiKey
  it('validates isBidRequestValid', () => {
    expect(config.runWithBidder('dailymotion', () => spec.isBidRequestValid())).to.be.false;

    const bidWithEmptyApi = {
      params: {
        apiKey: '',
      },
      mediaTypes: {
        [VIDEO]: {
          context: 'instream',
        },
      },
    };

    expect(config.runWithBidder('dailymotion', () => spec.isBidRequestValid(bidWithEmptyApi))).to.be.false;

    const bidWithApi = {
      params: {
        apiKey: 'test_api_key',
      },
      mediaTypes: {
        [VIDEO]: {
          context: 'instream',
        },
      },
    };

    expect(config.runWithBidder('dailymotion', () => spec.isBidRequestValid(bidWithApi))).to.be.true;

    const bidWithEmptyMediaTypes = {
      params: {
        apiKey: '',
      },
    };

    expect(config.runWithBidder('dailymotion', () => spec.isBidRequestValid(bidWithEmptyMediaTypes))).to.be.false;

    const bidWithEmptyVideoAdUnit = {
      params: {
        apiKey: '',
      },
      mediaTypes: {
        [VIDEO]: {},
      },
    };

    expect(config.runWithBidder('dailymotion', () => spec.isBidRequestValid(bidWithEmptyVideoAdUnit))).to.be.false;

    const bidWithBannerMediaType = {
      params: {
        apiKey: 'test_api_key',
      },
      mediaTypes: {
        [BANNER]: {},
      },
    };

    expect(config.runWithBidder('dailymotion', () => spec.isBidRequestValid(bidWithBannerMediaType))).to.be.false;

    const bidWithOutstreamContext = {
      params: {
        apiKey: 'test_api_key',
      },
      mediaTypes: {
        video: {
          context: 'outstream',
        },
      },
    };

    expect(config.runWithBidder('dailymotion', () => spec.isBidRequestValid(bidWithOutstreamContext))).to.be.false;
  });

  // Validate request generation
  it('validates buildRequests', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        dmTs: '123456',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerName: 'dailymotion',
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    config.setConfig({
      userSync: {
        syncEnabled: true,
        filterSettings: {
          all: {
            bidders: '*',
            filter: 'include'
          }
        }
      }
    });

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    const { data: reqData } = request;

    expect(request.options.withCredentials).to.eql(false);
    expect(request.url).to.equal('https://pb.dmxleo.com');

    expect(reqData.pbv).to.eql('$prebid.version$');
    expect(reqData.userSyncEnabled).to.be.true;
    expect(reqData.bidder_request).to.eql({
      refererInfo: bidderRequestData.refererInfo,
      uspConsent: bidderRequestData.uspConsent,
      gdprConsent: bidderRequestData.gdprConsent,
      gppConsent: bidderRequestData.gppConsent,
    });
    expect(reqData.config.api_key).to.eql(bidRequestData[0].params.apiKey);
    expect(reqData.config.ts).to.eql(bidRequestData[0].params.dmTs);
    expect(reqData.request.auctionId).to.eql(bidRequestData[0].auctionId);
    expect(reqData.request.bidId).to.eql(bidRequestData[0].bidId);
    expect(reqData.request.mediaTypes.video).to.eql(bidRequestData[0].mediaTypes.video);
    expect(reqData.video_metadata).to.eql({
      description: bidRequestData[0].params.video.description,
      iabcat1: ['IAB-1'],
      iabcat2: bidRequestData[0].params.video.iabcat2,
      id: bidRequestData[0].params.video.id,
      lang: bidRequestData[0].params.video.lang,
      private: bidRequestData[0].params.video.private,
      tags: bidRequestData[0].params.video.tags,
      title: bidRequestData[0].params.video.title,
      url: bidRequestData[0].params.video.url,
      topics: bidRequestData[0].params.video.topics,
      duration: bidRequestData[0].params.video.duration,
      livestream: !!bidRequestData[0].params.video.livestream,
      isCreatedForKids: bidRequestData[0].params.video.isCreatedForKids,
      context: {
        siteOrAppCat: [],
        siteOrAppContentCat: [],
        videoViewsInSession: bidRequestData[0].params.video.videoViewsInSession,
        autoplay: bidRequestData[0].params.video.autoplay,
        playerName: bidRequestData[0].params.video.playerName,
        playerVolume: bidRequestData[0].params.video.playerVolume,
      },
    });
  });

  it('validates buildRequests with global consent', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerName: 'dailymotion',
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
        vendorData: {
          hasGlobalConsent: true
        }
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    expect(request.options.withCredentials).to.eql(true);
  });

  it('validates buildRequests without gdpr applying', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerName: 'dailymotion',
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: false,
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    expect(request.options.withCredentials).to.eql(true);
  });

  it('validates buildRequests with detailed consent without legitimate interest', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerName: 'dailymotion',
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
        vendorData: {
          hasGlobalConsent: false,
          purpose: {
            consents: {
              1: true,
              2: true,
              3: true,
              4: true,
              7: true,
              9: true,
              10: true,
            },
          },
          vendor: {
            consents: {
              573: true
            }
          },
        },
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    expect(request.options.withCredentials).to.eql(false);
  });

  it('validates buildRequests with detailed consent, with legitimate interest', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerName: 'dailymotion',
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
        vendorData: {
          hasGlobalConsent: false,
          purpose: {
            consents: {
              1: true,
              3: true,
              4: true,
            },
            legitimateInterests: {
              2: true,
              7: true,
              9: true,
              10: true,
            },
          },
          vendor: {
            consents: {
              573: true
            }
          },
        },
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    expect(request.options.withCredentials).to.eql(true);
  });

  it('validates buildRequests with detailed consent and legitimate interest but publisher forces consent', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerName: 'dailymotion',
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
        vendorData: {
          hasGlobalConsent: false,
          publisher: {
            restrictions: {
              2: { 573: 1 },
              7: { 573: 1 },
              9: { 573: 1 },
              10: { 573: 1 },
            },
          },
          purpose: {
            consents: {
              1: true,
              3: true,
              4: true,
            },
            legitimateInterests: {
              2: true,
              7: true,
              9: true,
              10: true,
            },
          },
          vendor: {
            consents: {
              573: true
            }
          },
        },
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    expect(request.options.withCredentials).to.eql(false);
  });

  it('validates buildRequests with detailed consent, no legitimate interest and publisher forces consent', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerName: 'dailymotion',
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
        vendorData: {
          hasGlobalConsent: false,
          publisher: {
            restrictions: {
              2: { 573: 1 },
              7: { 573: 1 },
              9: { 573: 1 },
              10: { 573: 1 },
            },
          },
          purpose: {
            consents: {
              1: true,
              2: true,
              3: true,
              4: true,
              7: true,
              9: true,
              10: true,
            },
          },
          vendor: {
            consents: {
              573: true
            }
          },
        },
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    expect(request.options.withCredentials).to.eql(true);
  });

  it('validates buildRequests with detailed consent but publisher full restriction on purpose 1', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          xid: 'x123456',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
        vendorData: {
          hasGlobalConsent: false,
          publisher: {
            restrictions: {
              1: {
                573: 0,
              },
            },
          },
          purpose: {
            consents: {
              1: true,
              2: true,
              3: true,
              4: true,
              7: true,
              9: true,
              10: true,
            },
          },
          vendor: {
            consents: {
              573: true
            }
          },
        },
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    expect(request.options.withCredentials).to.eql(false);
  });

  it('validates buildRequests with detailed consent but publisher restriction 2 on consent purpose 1', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          xid: 'x123456',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
        vendorData: {
          hasGlobalConsent: false,
          publisher: {
            restrictions: {
              1: {
                573: 2,
              },
            },
          },
          purpose: {
            consents: {
              1: true,
              3: true,
              4: true,
            },
            legitimateInterests: {
              2: true,
              7: true,
              9: true,
              10: true,
            },
          },
          vendor: {
            consents: {
              573: true
            }
          },
        },
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    expect(request.options.withCredentials).to.eql(false);
  });

  it('validates buildRequests with detailed consent, legitimate interest and publisher restriction on purpose 1', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          xid: 'x123456',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
        vendorData: {
          hasGlobalConsent: false,
          publisher: {
            restrictions: {
              1: {
                573: 1,
              },
            },
          },
          purpose: {
            consents: {
              1: true,
              3: true,
              4: true,
            },
            legitimateInterests: {
              2: true,
              7: true,
              9: true,
              10: true,
            },
          },
          vendor: {
            consents: {
              573: true
            }
          },
        },
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    expect(request.options.withCredentials).to.eql(true);
  });

  it('validates buildRequests with detailed consent and legitimate interest but publisher restriction on legitimate interest 2', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          xid: 'x123456',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
        vendorData: {
          hasGlobalConsent: false,
          publisher: {
            restrictions: {
              2: {
                573: 2,
              },
            },
          },
          purpose: {
            consents: {
              1: true,
              3: true,
              4: true,
            },
            legitimateInterests: {
              2: true,
              7: true,
              9: true,
              10: true,
            },
          },
          vendor: {
            consents: {
              573: true
            }
          },
        },
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    expect(request.options.withCredentials).to.eql(true);
  });

  it('validates buildRequests with insufficient consent', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          iabcat1: ['IAB-1'],
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          livestream: 1,
          isCreatedForKids: true,
          videoViewsInSession: 2,
          autoplay: true,
          playerName: 'dailymotion',
          playerVolume: 8,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
        vendorData: {
          hasGlobalConsent: false,
          purpose: {
            consents: {
              1: true,
              3: true,
              4: true,
            },
          },
          vendor: {
            consents: {
              573: true
            }
          },
        },
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        regs: {
          coppa: 1,
        },
        site: {
          content: {
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    expect(request.options.withCredentials).to.eql(false);
  });

  it('validates buildRequests with content values from App', () => {
    const bidRequestData = [{
      getFloor: () => ({ currency: 'USD', floor: 3 }),
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          mimes: ['video/mp4'],
          minduration: 5,
          maxduration: 30,
          playbackmethod: [3],
          plcmt: 1,
          protocols: [1, 2, 3, 4, 5, 6, 7, 8],
          skip: 1,
          skipafter: 5,
          skipmin: 10,
          startdelay: 0,
          w: 1280,
          h: 720,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          iabcat2: ['6', '17'],
          id: '54321',
          lang: 'FR',
          private: false,
          tags: 'tag_1,tag_2,tag_3',
          title: 'test video',
          url: 'https://test.com/test',
          topics: 'topic_1, topic_2',
          livestream: 1,
          // Test invalid values
          isCreatedForKids: 'false',
          videoViewsInSession: -1,
          autoplay: 'true',
          playerName: 'dailymotion',
          playerVolume: 12,
        },
      },
    }];

    const bidderRequestData = {
      timeout: 4242,
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
      },
      gppConsent: {
        gppString: 'xxx',
        applicableSections: [5],
      },
      ortb2: {
        bcat: ['IAB-1'],
        badv: ['bcav-1'],
        regs: {
          coppa: 1,
        },
        device: {
          lmt: 1,
          ifa: 'xxx',
          devicetype: 2,
          make: 'make',
          model: 'model',
          os: 'os',
          osv: 'osv',
          language: 'language',
          geo: {
            country: 'country',
            region: 'region',
            city: 'city',
            zip: 'zip',
            metro: 'metro'
          },
          ext: {
            atts: 2,
            ifa_type: 'ifa_type'
          },
        },
        app: {
          bundle: 'app-bundle',
          storeurl: 'https://play.google.com/store/apps/details?id=app-bundle',
          content: {
            len: 556,
            cattax: 3,
            data: [
              {
                name: 'dataprovider.com',
                ext: { segtax: 4 },
                segment: [{ id: 'IAB-1' }],
              },
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '200' }],
              },
            ],
          },
        },
      },
    };

    config.setConfig({
      userSync: {
        syncEnabled: true,
        filterSettings: {
          iframe: {
            bidders: ['dailymotion'],
            filter: 'include'
          }
        }
      }
    });

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    const { data: reqData } = request;

    expect(request.url).to.equal('https://pb.dmxleo.com');

    expect(reqData.pbv).to.eql('$prebid.version$');

    const expectedOrtb = {
      'app': {
        'bundle': 'app-bundle',
        'content': {
          'cattax': 3,
          'data': [
            {
              'ext': {
                'segtax': 4
              },
              'name': 'dataprovider.com',
              'segment': [
                {
                  'id': 'IAB-1'
                }
              ]
            },
            {
              'ext': {
                'segtax': 5
              },
              'name': 'dataprovider.com',
              'segment': [
                {
                  'id': '200'
                }
              ],
            }
          ],
          'len': 556,
        },
        'storeurl': 'https://play.google.com/store/apps/details?id=app-bundle',
      },
      'badv': [
        'bcav-1'
      ],
      'bcat': [
        'IAB-1'
      ],
      'device': {
        'devicetype': 2,
        'ext': {
          'atts': 2,
          'ifa_type': 'ifa_type'
        },
        'geo': {
          'city': 'city',
          'country': 'country',
          'metro': 'metro',
          'region': 'region',
          'zip': 'zip',
        },
        'ifa': 'xxx',
        'language': 'language',
        'lmt': 1,
        'make': 'make',
        'model': 'model',
        'os': 'os',
        'osv': 'osv',
      },
      'imp': [{
        'bidfloor': 3,
        'bidfloorcur': 'USD',
        'id': 123456,
        'secure': 1,
        ...(FEATURES.VIDEO ? {
          'video': {
            'api': [
              2,
              7
            ],
            'h': 720,
            'maxduration': 30,
            'mimes': [
              'video/mp4'
            ],
            'minduration': 5,
            'playbackmethod': [
              3
            ],
            'plcmt': 1,
            'protocols': [
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8
            ],
            'skip': 1,
            'skipafter': 5,
            'skipmin': 10,
            'startdelay': 0,
            'w': 1280,
          }
        } : {}),
      }
      ],
      'regs': {
        'coppa': 1,
      },
      'test': 0,
      'tmax': 4242,
    }

    expect(reqData.ortb.id).to.be.not.empty;
    delete reqData.ortb.id; // ortb id is generated randomly
    expect(reqData.ortb).to.eql(expectedOrtb);
    expect(reqData.userSyncEnabled).to.be.true;
    expect(reqData.bidder_request).to.eql({
      refererInfo: bidderRequestData.refererInfo,
      uspConsent: bidderRequestData.uspConsent,
      gdprConsent: bidderRequestData.gdprConsent,
      gppConsent: bidderRequestData.gppConsent,
    });
    expect(reqData.config.api_key).to.eql(bidRequestData[0].params.apiKey);
    expect(reqData.request.auctionId).to.eql(bidRequestData[0].auctionId);
    expect(reqData.request.bidId).to.eql(bidRequestData[0].bidId);

    expect(reqData.request.mediaTypes.video).to.eql(bidRequestData[0].mediaTypes.video);

    expect(reqData.video_metadata).to.eql({
      description: bidRequestData[0].params.video.description,
      iabcat1: ['IAB-1'],
      iabcat2: bidRequestData[0].params.video.iabcat2,
      id: bidRequestData[0].params.video.id,
      lang: bidRequestData[0].params.video.lang,
      private: bidRequestData[0].params.video.private,
      tags: bidRequestData[0].params.video.tags,
      title: bidRequestData[0].params.video.title,
      url: bidRequestData[0].params.video.url,
      topics: bidRequestData[0].params.video.topics,
      // Overriden through bidder params
      duration: bidderRequestData.ortb2.app.content.len,
      livestream: !!bidRequestData[0].params.video.livestream,
      isCreatedForKids: null,
      context: {
        siteOrAppCat: [],
        siteOrAppContentCat: [],
        videoViewsInSession: null,
        autoplay: null,
        playerName: 'dailymotion',
        playerVolume: null,
      },
    });
  });

  it('validates buildRequests with fallback values on ortb2 (gpp, iabcat2, id...)', () => {
    const bidRequestData = [{
      auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
      bidId: 123456,
      adUnitCode: 'preroll',
      mediaTypes: {
        video: {
          api: [2, 7],
          startdelay: 0,
        },
      },
      sizes: [[1920, 1080]],
      params: {
        apiKey: 'test_api_key',
        video: {
          description: 'this is a test video',
          duration: 556,
          private: false,
          title: 'test video',
          topics: 'topic_1, topic_2',
          isCreatedForKids: false,
          videoViewsInSession: 10,
          autoplay: false,
          playerName: 'dailymotion',
          playerVolume: 0,
        },
      },
    }];

    const bidderRequestData = {
      refererInfo: {
        page: 'https://publisher.com',
      },
      uspConsent: '1YN-',
      gdprConsent: {
        apiVersion: 2,
        consentString: 'xxx',
        gdprApplies: true,
      },
      ortb2: {
        tmax: 31416,
        regs: {
          gpp: 'xxx',
          gpp_sid: [5],
          coppa: 0,
        },
        site: {
          cat: ['IAB-1'],
          content: {
            id: '54321',
            language: 'FR',
            keywords: 'tag_1,tag_2,tag_3',
            title: 'test video',
            url: 'https://test.com/test',
            livestream: 1,
            cat: ['IAB-2'],
            cattax: 1,
            data: [
              undefined, // Undefined to check proper handling of edge cases
              {}, // Empty object to check proper handling of edge cases
              { ext: {} }, // Empty ext to check proper handling of edge cases
              {
                name: 'dataprovider.com',
                ext: { segtax: 22 }, // Invalid segtax to check proper handling of edge cases
                segment: [{ id: '400' }],
              },
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: undefined, // Invalid segment to check proper handling of edge cases
              },
              {
                name: 'dataprovider.com',
                ext: { segtax: 4 },
                segment: undefined, // Invalid segment to check proper handling of edge cases
              },
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: 2222 }], // Invalid segment id to check proper handling of edge cases
              },
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '6' }],
              },
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '6' }], // Check that same cat won't be duplicated
              },
              {
                name: 'dataprovider.com',
                ext: { segtax: 5 },
                segment: [{ id: '17' }, { id: '20' }],
              },
            ],
          },
        },
      },
    };

    config.setConfig({
      userSync: {
        syncEnabled: true,
        filterSettings: {
          image: {
            bidders: ['dailymotion'],
            filter: 'include'
          },
          iframe: {
            bidders: ['dailymotion'],
            filter: 'exclude',
          },
        }
      }
    });

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestData, bidderRequestData),
    );

    const { data: reqData } = request;

    expect(request.url).to.equal('https://pb.dmxleo.com');

    const expectedOrtb = {
      'imp': [{
        'id': 123456,
        'secure': 1,
        ...(FEATURES.VIDEO ? {
          'video': {
            'api': [
              2,
              7
            ],
            'startdelay': 0,
          }
        } : {})
      }
      ],
      'regs': {
        'coppa': 0,
        'gpp': 'xxx',
        'gpp_sid': [
          5
        ],
      },
      'site': {
        'cat': [
          'IAB-1',
        ],
        'content': {
          'cat': [
            'IAB-2',
          ],
          'cattax': 1,
          'data': [
            undefined,
            {},
            {
              'ext': {}
            },
            {
              'ext': {
                'segtax': 22
              },
              'name': 'dataprovider.com',
              'segment': [
                {
                  'id': '400'
                }
              ]
            },
            {
              'ext': {
                'segtax': 5
              },
              'name': 'dataprovider.com',
              'segment': undefined
            },
            {
              'ext': {
                'segtax': 4
              },
              'name': 'dataprovider.com',
              'segment': undefined
            },
            {
              'ext': {
                'segtax': 5
              },
              'name': 'dataprovider.com',
              'segment': [
                {
                  'id': 2222
                }
              ]
            },
            {
              'ext': {
                'segtax': 5
              },
              'name': 'dataprovider.com',
              'segment': [
                {
                  'id': '6'
                }
              ]
            },
            {
              'ext': {
                'segtax': 5
              },
              'name': 'dataprovider.com',
              'segment': [
                {
                  'id': '6'
                }
              ]
            },
            {
              'ext': {
                'segtax': 5
              },
              'name': 'dataprovider.com',
              'segment': [
                {
                  'id': '17'
                },
                {
                  'id': '20'
                }
              ]
            }
          ],
          'id': '54321',
          'keywords': 'tag_1,tag_2,tag_3',
          'language': 'FR',
          'livestream': 1,
          'title': 'test video',
          'url': 'https://test.com/test',
        }
      },
      'test': 0,
      'tmax': 31416
    }

    expect(reqData.pbv).to.eql('$prebid.version$');
    expect(reqData.ortb.id).to.be.not.empty;
    delete reqData.ortb.id; // ortb id is generated randomly
    expect(reqData.ortb).to.eql(expectedOrtb);

    expect(reqData.userSyncEnabled).to.be.true;
    expect(reqData.bidder_request).to.eql({
      refererInfo: bidderRequestData.refererInfo,
      uspConsent: bidderRequestData.uspConsent,
      gdprConsent: bidderRequestData.gdprConsent,
      gppConsent: {
        gppString: bidderRequestData.ortb2.regs.gpp,
        applicableSections: bidderRequestData.ortb2.regs.gpp_sid,
      },
    });
    expect(reqData.config.api_key).to.eql(bidRequestData[0].params.apiKey);
    expect(reqData.request.auctionId).to.eql(bidRequestData[0].auctionId);
    expect(reqData.request.bidId).to.eql(bidRequestData[0].bidId);

    expect(reqData.request.mediaTypes.video).to.eql({
      ...bidRequestData[0].mediaTypes.video,
      mimes: [],
      minduration: 0,
      maxduration: 0,
      playbackmethod: [],
      plcmt: undefined,
      protocols: [],
      skip: 0,
      skipafter: 0,
      skipmin: 0,
      w: 0,
      h: 0,
    });

    expect(reqData.video_metadata).to.eql({
      description: bidRequestData[0].params.video.description,
      iabcat1: ['IAB-2'],
      iabcat2: ['6', '17', '20'],
      id: bidderRequestData.ortb2.site.content.id,
      lang: bidderRequestData.ortb2.site.content.language,
      private: bidRequestData[0].params.video.private,
      tags: bidderRequestData.ortb2.site.content.keywords,
      title: bidderRequestData.ortb2.site.content.title,
      url: bidderRequestData.ortb2.site.content.url,
      topics: bidRequestData[0].params.video.topics,
      duration: bidRequestData[0].params.video.duration,
      livestream: !!bidderRequestData.ortb2.site.content.livestream,
      isCreatedForKids: bidRequestData[0].params.video.isCreatedForKids,
      context: {
        siteOrAppCat: bidderRequestData.ortb2.site.cat,
        siteOrAppContentCat: bidderRequestData.ortb2.site.content.cat,
        videoViewsInSession: bidRequestData[0].params.video.videoViewsInSession,
        autoplay: bidRequestData[0].params.video.autoplay,
        playerName: bidRequestData[0].params.video.playerName,
        playerVolume: bidRequestData[0].params.video.playerVolume,
      },
    });
  });

  it('validates buildRequests - with default values on empty bid & bidder request', () => {
    const bidRequestDataWithApi = [{
      params: {
        apiKey: 'test_api_key',
      },
    }];

    config.setConfig({
      userSync: {
        syncEnabled: false,
      }
    });

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequestDataWithApi, {}),
    );

    const { data: reqData } = request;

    expect(request.url).to.equal('https://pb.dmxleo.com');
    expect(reqData.config.api_key).to.eql(bidRequestDataWithApi[0].params.apiKey);
    expect(reqData.pbv).to.eql('$prebid.version$');

    expect(reqData.ortb.id).to.be.not.empty;
    delete reqData.ortb.id; // ortb id is generated randomly
    expect(reqData.ortb).to.eql({
      'imp': [
        {
          'id': undefined,
          'secure': 1
        },
      ],
      'test': 0
    });
    expect(reqData.userSyncEnabled).to.be.false;
    expect(reqData.bidder_request).to.eql({
      gdprConsent: {
        apiVersion: 1,
        consentString: '',
        gdprApplies: false,
      },
      refererInfo: {
        page: '',
      },
      uspConsent: '',
      gppConsent: {
        gppString: '',
        applicableSections: [],
      },
    });

    expect(reqData.request).to.eql({
      auctionId: '',
      bidId: '',
      adUnitCode: '',
      mediaTypes: {
        video: {
          api: [],
          mimes: [],
          minduration: 0,
          maxduration: 0,
          playbackmethod: [],
          plcmt: undefined,
          protocols: [],
          skip: 0,
          skipafter: 0,
          skipmin: 0,
          startdelay: undefined,
          w: 0,
          h: 0,
        },
      },
      sizes: [],
    });

    expect(reqData.video_metadata).to.eql({
      description: '',
      duration: 0,
      iabcat1: [],
      iabcat2: [],
      id: '',
      lang: '',
      private: false,
      tags: '',
      title: '',
      url: '',
      topics: '',
      livestream: false,
      isCreatedForKids: null,
      context: {
        siteOrAppCat: [],
        siteOrAppContentCat: [],
        videoViewsInSession: null,
        autoplay: null,
        playerName: '',
        playerVolume: null,
      },
    });
  });

  describe('validates buildRequests for video metadata iabcat1 and iabcat2', () => {
    let bidRequestData;
    let bidderRequestData;
    let request;

    beforeEach(() => {
      bidRequestData = [{
        auctionId: 'b06c5141-fe8f-4cdf-9d7d-54415490a917',
        bidId: 123456,
        adUnitCode: 'preroll',
        mediaTypes: {
          video: {
            api: [2, 7],
            startdelay: 0,
          },
        },
        sizes: [[1920, 1080]],
        params: {
          apiKey: 'test_api_key',
          video: {
            iabcat1: ['video-params-iabcat1'],
            iabcat2: ['video-params-iabcat2'],
          },
        },
      }];

      bidderRequestData = {
        timeout: 4242,
        refererInfo: {
          page: 'https://publisher.com',
        },
        ortb2: {
          site: {
            content: {
              data: [
                {
                  name: 'dataprovider.com',
                  ext: { segtax: 4 },
                  segment: [{ id: '1' }],
                },
                {
                  name: 'dataprovider.com',
                  ext: { segtax: 5 },
                  segment: [{ id: '6' }],
                },
                {
                  name: 'dataprovider.com',
                  ext: { segtax: 5 },
                  segment: [{ id: '17' }, { id: '20' }],
                },
              ]
            },
          }
        }
      };

      config.setConfig({
        userSync: {
          syncEnabled: true,
          filterSettings: {
            image: {
              bidders: ['dailymotion'],
              filter: 'include'
            },
            iframe: {
              bidders: ['dailymotion'],
              filter: 'exclude',
            },
          },
        },
      });

      [request] = config.runWithBidder(
        'dailymotion',
        () => spec.buildRequests(bidRequestData, bidderRequestData),
      );
    });

    it('get iabcat1 and iabcat 2 from params video', () => {
      expect(request.data.video_metadata.iabcat1).to.eql(bidRequestData[0].params.video.iabcat1);
      expect(request.data.video_metadata.iabcat2).to.eql(bidRequestData[0].params.video.iabcat2);
    })

    it('get iabcat1 from content.cat and iabcat2 from data.segment', () => {
      const iabCatTestsCases = [[], null, {}];

      iabCatTestsCases.forEach((iabCat) => {
        bidRequestData[0].params.video.iabcat1 = iabCat;
        bidRequestData[0].params.video.iabcat2 = iabCat;
        bidderRequestData.ortb2.site.content.cat = ['video-content-cat'];
        bidderRequestData.ortb2.site.content.cattax = 1;

        [request] = config.runWithBidder(
          'dailymotion',
          () => spec.buildRequests(bidRequestData, bidderRequestData),
        );

        expect(request.data.video_metadata.iabcat1).to.eql(bidderRequestData.ortb2.site.content.cat);
        expect(request.data.video_metadata.iabcat2).to.eql(['6', '17', '20']);
      })
    })

    it('get iabcat2 from content.cat and iabcat1 from data.segment', () => {
      const iabCatTestsCases = [[], null, {}];
      const cattaxV2 = [2, 5, 6];

      cattaxV2.forEach((cattax) => {
        iabCatTestsCases.forEach((iabCat) => {
          bidRequestData[0].params.video.iabcat1 = iabCat;
          bidRequestData[0].params.video.iabcat2 = iabCat;
          bidderRequestData.ortb2.site.content.cat = ['video-content-cat'];
          bidderRequestData.ortb2.site.content.cattax = cattax;

          [request] = config.runWithBidder(
            'dailymotion',
            () => spec.buildRequests(bidRequestData, bidderRequestData),
          );

          expect(request.data.video_metadata.iabcat1).to.eql(['1']);
          expect(request.data.video_metadata.iabcat2).to.eql(bidderRequestData.ortb2.site.content.cat);
        })
      })
    })

    it('get iabcat1 and iabcat2 from data.segmnet', () => {
      const contentCatTestCases = [[], null, {}];
      const cattaxTestCases = [1, 2, 5, 6];

      cattaxTestCases.forEach((cattax) => {
        contentCatTestCases.forEach((contentCat) => {
          bidRequestData[0].params.video.iabcat1 = [];
          bidRequestData[0].params.video.iabcat2 = [];
          bidderRequestData.ortb2.site.content.cat = contentCat;
          bidderRequestData.ortb2.site.content.cattax = cattax;

          [request] = config.runWithBidder(
            'dailymotion',
            () => spec.buildRequests(bidRequestData, bidderRequestData),
          );

          expect(request.data.video_metadata.iabcat1).to.eql(['1']);
          expect(request.data.video_metadata.iabcat2).to.eql(['6', '17', '20']);
        })
      })
    })
  });

  it('validates buildRequests - with null floor as object for getFloor function', () => {
    const bidRequest = [{
      params: {
        apiKey: 'test_api_key',
      },
      getFloor: () => null
    }];

    config.setConfig({
      userSync: {
        syncEnabled: false,
      }
    });

    const [request] = config.runWithBidder(
      'dailymotion',
      () => spec.buildRequests(bidRequest, {}),
    );

    const { data: reqData } = request;

    expect(reqData.ortb.id).to.be.not.empty;
    delete reqData.ortb.id; // ortb id is generated randomly
    expect(reqData.ortb).to.eql({
      'imp': [
        {
          'id': undefined,
          'secure': 1
        },
      ],
      'test': 0
    });
  })

  it('validates buildRequests - with empty/undefined validBidRequests', () => {
    expect(spec.buildRequests([], {})).to.have.lengthOf(0);

    expect(spec.buildRequests(undefined, {})).to.have.lengthOf(0);
  });

  it('validates interpretResponse', () => {
    const serverResponse = {
      body: {
        ad: 'https://fakecacheserver/cache?uuid=1234',
        cacheId: '1234',
        cpm: 20.0,
        creativeId: '5678',
        currency: 'USD',
        dealId: 'deal123',
        nurl: 'https://bid/nurl',
        requestId: 'test_requestid',
        vastUrl: 'https://fakecacheserver/cache?uuid=1234',
      },
    };

    const bids = spec.interpretResponse(serverResponse);
    expect(bids).to.have.lengthOf(1);

    const [bid] = bids;
    expect(bid).to.eql(serverResponse.body);
  });

  it('validates interpretResponse - without bid (no cpm)', () => {
    const serverResponse = {
      body: {
        requestId: 'test_requestid',
      },
    };

    const bids = spec.interpretResponse(serverResponse);
    expect(bids).to.have.lengthOf(0);
  });

  it('validates interpretResponse - with empty/undefined serverResponse', () => {
    expect(spec.interpretResponse({})).to.have.lengthOf(0);

    expect(spec.interpretResponse(undefined)).to.have.lengthOf(0);
  });

  it('validates getUserSyncs', () => {
    // Nothing sent in getUserSyncs
    expect(config.runWithBidder('dailymotion', () => spec.getUserSyncs())).to.eql([]);

    // No server response
    {
      const responses = [];
      const syncOptions = { iframeEnabled: true, pixelEnabled: true };

      expect(config.runWithBidder(
        'dailymotion',
        () => spec.getUserSyncs(syncOptions, responses),
      )).to.eql([]);
    }

    // No permissions
    {
      const responses = [{ body: { userSyncs: [{ url: 'https://usersyncurl.com', type: 'image' }] } }];
      const syncOptions = { iframeEnabled: false, pixelEnabled: false };

      expect(config.runWithBidder(
        'dailymotion',
        () => spec.getUserSyncs(syncOptions, responses),
      )).to.eql([]);
    }

    // Has permissions but no userSyncs urls
    {
      const responses = [{}];
      const syncOptions = { iframeEnabled: false, pixelEnabled: true };

      expect(config.runWithBidder(
        'dailymotion',
        () => spec.getUserSyncs(syncOptions, responses),
      )).to.eql([]);
    }

    // Return userSyncs urls for pixels
    {
      const responses = [{
        body: {
          userSyncs: [
            { url: 'https://usersyncurl.com', type: 'image' },
            { url: 'https://usersyncurl2.com', type: 'image' },
            { url: 'https://usersyncurl3.com', type: 'iframe' }
          ],
        }
      }];

      const syncOptions = { iframeEnabled: false, pixelEnabled: true };

      expect(config.runWithBidder(
        'dailymotion',
        () => spec.getUserSyncs(syncOptions, responses),
      )).to.eql([
        { type: 'image', url: 'https://usersyncurl.com' },
        { type: 'image', url: 'https://usersyncurl2.com' },
      ]);
    }

    // Return userSyncs urls for iframes
    {
      const responses = [{
        body: {
          userSyncs: [
            { url: 'https://usersyncurl.com', type: 'image' },
            { url: 'https://usersyncurl2.com', type: 'image' },
            { url: 'https://usersyncurl3.com', type: 'iframe' }
          ],
        }
      }];

      const syncOptions = { iframeEnabled: true, pixelEnabled: true };

      expect(config.runWithBidder(
        'dailymotion',
        () => spec.getUserSyncs(syncOptions, responses),
      )).to.eql([
        { type: 'iframe', url: 'https://usersyncurl3.com' },
      ]);
    }
  });
});
