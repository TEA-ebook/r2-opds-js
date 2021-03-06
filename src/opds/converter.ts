// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Metadata } from "@r2-shared-js/models/metadata";
import { BelongsTo } from "@r2-shared-js/models/metadata-belongsto";
import { Contributor } from "@r2-shared-js/models/metadata-contributor";
import { Subject } from "@r2-shared-js/models/metadata-subject";
import { Link } from "@r2-shared-js/models/publication-link";

import { OPDS } from "./opds1/opds";
import { Entry } from "./opds1/opds-entry";
import { OPDSFeed } from "./opds2/opds2";
import { OPDSIndirectAcquisition } from "./opds2/opds2-indirectAcquisition";
import { OPDSLink } from "./opds2/opds2-link";
import { OPDSMetadata } from "./opds2/opds2-metadata";
import { OPDSPrice } from "./opds2/opds2-price";
import { OPDSProperties } from "./opds2/opds2-properties";
import { OPDSPublication } from "./opds2/opds2-publication";

// import { OPDSCollection } from "./opds2/opds2-collection";
// import { OPDSContributor } from "./opds2/opds2-contributor";
// import { OPDSPublicationMetadata } from "./opds2/opds2-publicationMetadata";

export function convertOpds1ToOpds2_EntryToPublication(entry: Entry): OPDSPublication {

    const p = new OPDSPublication();
    p.Metadata = new Metadata();

    if (entry.Title) {
        // tslint:disable-next-line: max-line-length
        p.Metadata.Title = ((entry.TitleType === "text/html" || entry.TitleType === "html" || entry.TitleType === "xhtml") ?
            // entry.Title.replace(/xmlns=["'][^"']+["']/g, " ") :
            entry.Title.replace(/xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/g, " ") :
            entry.Title);
    }

    if (entry.SubTitle) {
        // tslint:disable-next-line: max-line-length
        p.Metadata.SubTitle = ((entry.SubTitleType === "text/html" || entry.SubTitleType === "html" || entry.SubTitleType === "xhtml") ?
            // entry.SubTitle.replace(/xmlns=["'][^"']+["']/g, " ") :
            entry.SubTitle.replace(/xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/g, " ") :
            entry.SubTitle);
    }

    if (entry.DcIdentifier) {
        p.Metadata.Identifier = entry.DcIdentifier;
    } else {
        p.Metadata.Identifier = entry.Id;
    }
    if (entry.DcLanguage) {
        p.Metadata.Language = [entry.DcLanguage];
    }
    p.Metadata.Modified = entry.Updated;
    p.Metadata.PublicationDate = entry.Published;
    p.Metadata.Rights = entry.DcRights;
    if (entry.Series) {
        entry.Series.forEach((s) => {
            const coll = new Contributor();
            coll.Name = s.Name;
            coll.Position = s.Position;
            const link = new Link();
            link.Href = s.Url;
            coll.Links = [];
            coll.Links.push(link);

            if (!p.Metadata.BelongsTo) {
                p.Metadata.BelongsTo = new BelongsTo();
            }
            if (!p.Metadata.BelongsTo.Series) {
                p.Metadata.BelongsTo.Series = [];
            }
            p.Metadata.BelongsTo.Series.push(coll);
        });
    }
    if (entry.DcPublisher) {
        const c = new Contributor();
        c.Name = entry.DcPublisher;
        if (!p.Metadata.Publisher) {
            p.Metadata.Publisher = [];
        }
        p.Metadata.Publisher.push(c);
    }

    if (entry.Categories) {
        entry.Categories.forEach((cat) => {
            const subj = new Subject();
            subj.Code = cat.Term;
            subj.Name = cat.Label;
            subj.Scheme = cat.Scheme;
            if (!p.Metadata.Subject) {
                p.Metadata.Subject = [];
            }
            p.Metadata.Subject.push(subj);
        });
    }
    if (entry.Authors) {
        entry.Authors.forEach((aut) => {

            const cont = new Contributor();
            cont.Name = aut.Name;
            cont.Identifier = aut.Uri;
            if (!p.Metadata.Author) {
                p.Metadata.Author = [];
            }
            p.Metadata.Author.push(cont);
        });
    }

    if (entry.Summary) {
        // tslint:disable-next-line: max-line-length
        p.Metadata.Description = ((entry.SummaryType === "text/html" || entry.SummaryType === "html" || entry.SummaryType === "xhtml") ?
            // entry.Summary.replace(/xmlns=["'][^"']+["']/g, " ") :
            entry.Summary.replace(/xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/g, " ") :
            entry.Summary);
    }

    if (entry.Content) {
        // tslint:disable-next-line: max-line-length
        const txt = ((entry.ContentType === "text/html" || entry.ContentType === "html" || entry.ContentType === "xhtml") ?
            // entry.Content.replace(/xmlns=["'][^"']+["']/g, " ") :
            entry.Content.replace(/xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/g, " ") :
            entry.Content);

        if (p.Metadata.Description) {
            p.Metadata.Description += "\n\n";
            p.Metadata.Description += txt;
        } else {
            p.Metadata.Description = txt;
        }
    }

    if (entry.Links) {
        entry.Links.forEach((link) => {
            const l = new OPDSLink();
            l.Href = link.Href;
            l.TypeLink = link.Type;
            l.AddRel(link.Rel);
            l.Title = link.Title;

            if (link.ThrCount) {
                if (!l.Properties) {
                    l.Properties = new OPDSProperties();
                }
                l.Properties.NumberOfItems = link.ThrCount;
            }

            if (link.OpdsIndirectAcquisitions && link.OpdsIndirectAcquisitions.length) {
                if (!l.Properties) {
                    l.Properties = new OPDSProperties();
                }

                link.OpdsIndirectAcquisitions.forEach((ia) => {
                    const ind = new OPDSIndirectAcquisition();
                    ind.TypeAcquisition = ia.OpdsIndirectAcquisitionType;
                    if (ia.OpdsIndirectAcquisitions && ia.OpdsIndirectAcquisitions.length) {
                        ia.OpdsIndirectAcquisitions.forEach((iac) => {

                            const cia = new OPDSIndirectAcquisition();
                            cia.TypeAcquisition = iac.OpdsIndirectAcquisitionType;
                            if (!ind.Children) {
                                ind.Children = [];
                            }
                            ind.Children.push(cia);
                        });
                    }
                    if (!l.Properties.IndirectAcquisitions) {
                        l.Properties.IndirectAcquisitions = [];
                    }
                    l.Properties.IndirectAcquisitions.push(ind);
                });
            }

            if (link.OpdsPrice && link.OpdsPriceCurrencyCode) {
                if (!l.Properties) {
                    l.Properties = new OPDSProperties();
                }
                l.Properties.Price = new OPDSPrice();
                l.Properties.Price.Currency = link.OpdsPriceCurrencyCode;
                l.Properties.Price.Value = link.OpdsPrice;
            }

            if (link.HasRel("collection") || link.HasRel("http://opds-spec.org/group")) {
                // NOOP
            } else if (link.HasRel("http://opds-spec.org/image") ||
                link.HasRel("http://opds-spec.org/image/thumbnail") ||

                link.HasRel("http://opds-spec.org/cover") || // incorrect OPDS1, but exists in the wild :(
                link.HasRel("http://opds-spec.org/thumbnail") || // incorrect OPDS1, but exists in the wild :(

                link.HasRel("x-stanza-cover-image") || // legacy Stanza
                link.HasRel("x-stanza-cover-image-thumbnail")) {

                const iCoverRel = l.Rel.indexOf("http://opds-spec.org/cover");
                if (iCoverRel >= 0) {
                    l.Rel[iCoverRel] = "http://opds-spec.org/image"; // fix the erroneous OPDS1 rel
                }

                const iThumbnailRel = l.Rel.indexOf("http://opds-spec.org/thumbnail");
                if (iThumbnailRel >= 0) {
                    l.Rel[iThumbnailRel] = "http://opds-spec.org/image/thumbnail"; // fix the erroneous OPDS1 rel
                }

                if (!p.Images) {
                    p.Images = [];
                }
                p.Images.push(l);
            } else {
                if (!p.Links) {
                    p.Links = [];
                }
                p.Links.push(l);
            }
        });
    }

    return p;
}
export function convertOpds1ToOpds2_EntryToLink(entry: Entry): OPDSLink {

    const linkNav = new OPDSLink();

    if (entry.Title) {
        // tslint:disable-next-line: max-line-length
        linkNav.Title = ((entry.TitleType === "text/html" || entry.TitleType === "html" || entry.TitleType === "xhtml") ?
            // entry.Title.replace(/xmlns=["'][^"']+["']/g, " ") :
            entry.Title.replace(/xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/g, " ") :
            entry.Title);
    }

    if (entry.Summary) {
        // tslint:disable-next-line: max-line-length
        const txt = ((entry.SummaryType === "text/html" || entry.SummaryType === "html" || entry.SummaryType === "xhtml") ?
            // entry.Summary.replace(/xmlns=["'][^"']+["']/g, " ") :
            entry.Summary.replace(/xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/g, " ") :
            entry.Summary);

        if (linkNav.Title) {
            linkNav.Title += "\n\n";
            linkNav.Title += txt;
        } else {
            linkNav.Title = txt;
        }
    }

    if (entry.Content) {
        // tslint:disable-next-line: max-line-length
        const txt = ((entry.ContentType === "text/html" || entry.ContentType === "html" || entry.ContentType === "xhtml") ?
            // entry.Content.replace(/xmlns=["'][^"']+["']/g, " ") :
            entry.Content.replace(/xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/g, " ") :
            entry.Content);

        if (linkNav.Title) {
            linkNav.Title += "\n\n";
            linkNav.Title += txt;
        } else {
            linkNav.Title = txt;
        }
    }

    if (entry.Links) {
        const atomLink = entry.Links.find((l) => {
            return l.Type && l.Type.indexOf("application/atom+xml") >= 0;
        });
        const link = atomLink ? atomLink : (entry.Links[0] ? entry.Links[0] : undefined);
        if (link) {

            if (link.ThrCount) {
                if (!linkNav.Properties) {
                    linkNav.Properties = new OPDSProperties();
                }
                linkNav.Properties.NumberOfItems = link.ThrCount;
            }

            linkNav.AddRel(link.Rel);
            linkNav.TypeLink = link.Type;
            linkNav.Href = link.Href;
        }
    }

    return linkNav;
}

// https://github.com/opds-community/opds-revision
export function convertOpds1ToOpds2(feed: OPDS): OPDSFeed {
    const opds2feed = new OPDSFeed();

    opds2feed.Metadata = new OPDSMetadata();
    opds2feed.Metadata.Title = feed.Title;
    opds2feed.Metadata.Modified = feed.Updated;
    if (feed.OpensearchTotalResults) {
        opds2feed.Metadata.NumberOfItems = feed.OpensearchTotalResults;
    }
    if (feed.OpensearchItemsPerPage) {
        opds2feed.Metadata.ItemsPerPage = feed.OpensearchItemsPerPage;
    }
    if (feed.Authors) {
        feed.Authors.forEach((aut) => {

            const cont = new Contributor();
            cont.Name = aut.Name;
            cont.Identifier = aut.Uri;
            if (!opds2feed.Metadata.Author) {
                opds2feed.Metadata.Author = [];
            }
            opds2feed.Metadata.Author.push(cont);
        });
    }
    if (feed.Entries) {
        feed.Entries.forEach((entry) => {
            let isAnNavigation = true;
            let thereIsAtomLink = false;
            // let thereIsImageLink = false;

            const collLink = new OPDSLink();

            if (entry.Links) {
                entry.Links.forEach((l) => {

                    if (l.ThrCount) {
                        if (!collLink.Properties) {
                            collLink.Properties = new OPDSProperties();
                        }
                        collLink.Properties.NumberOfItems = l.ThrCount;
                    }

                    // the JSON Schema uri-reference validator trips on space characters, but not unicode chars
                    if (l.Href) {
                        l.Href = l.Href.replace(/ /g, "%20");
                    }

                    // fix incorrect JPEG content type
                    if (l.Type === "image/jpg") {
                        l.Type = "image/jpeg";
                    }

                    // if (l.HasRel("http://opds-spec.org/acquisition")
                    //     || l.HasRel("http://opds-spec.org/acquisition/buy")) {
                    if ((l.Rel && l.Rel.indexOf("http://opds-spec.org/acquisition") === 0) ||
                        (!l.Rel && l.Type === "application/epub+zip")) {
                        if (!l.Rel) { // workaround for feed links with missing rel
                            l.Rel = "http://opds-spec.org/acquisition";
                        }
                        isAnNavigation = false;
                    }
                    if (l.HasRel("collection") || l.HasRel("http://opds-spec.org/group")) {
                        collLink.AddRel("collection");
                        collLink.Href = l.Href;
                        collLink.Title = l.Title;
                    }

                    if (l.Type && l.Type.indexOf("application/atom+xml") >= 0) {
                        thereIsAtomLink = true;
                    }

                    // if (l.Type && l.Type.indexOf("image/") >= 0) {
                    //     thereIsImageLink = true;
                    // }
                });
            }

            const thereIsAuthor = entry.Authors && entry.Authors.length;

            // no acquisition link ... let's duck-type further to infer the "publications" nature:
            // thereIsImageLink cannot be used here, because some OPDS navigation feeds provide an image thumbnail
            if (isAnNavigation && thereIsAuthor) {
                isAnNavigation = false;
            }
            if (isAnNavigation && !thereIsAtomLink) {
                isAnNavigation = false;
            }

            if (!isAnNavigation) {
                const p = convertOpds1ToOpds2_EntryToPublication(entry);
                if (collLink.Href) {
                    opds2feed.AddPublicationInGroup(p, collLink);
                } else {
                    if (!opds2feed.Publications) {
                        opds2feed.Publications = [];
                    }
                    opds2feed.Publications.push(p);
                }
            } else {
                const linkNav = convertOpds1ToOpds2_EntryToLink(entry);
                if (collLink.Href) {
                    opds2feed.AddNavigationInGroup(linkNav, collLink);
                } else {
                    if (!opds2feed.Navigation) {
                        opds2feed.Navigation = [];
                    }
                    opds2feed.Navigation.push(linkNav);
                }
            }
        });
    }

    if (feed.Links) {
        feed.Links.forEach((l) => {

            // the JSON Schema uri-reference validator trips on space characters, but not unicode chars
            if (l.Href) {
                l.Href = l.Href.replace(/ /g, "%20");
            }

            const linkFeed = new OPDSLink();
            linkFeed.Href = l.Href;
            linkFeed.AddRel(l.Rel);
            linkFeed.TypeLink = l.Type;
            linkFeed.Title = l.Title;

            if (l.ThrCount) {
                if (!linkFeed.Properties) {
                    linkFeed.Properties = new OPDSProperties();
                }
                linkFeed.Properties.NumberOfItems = l.ThrCount;
            }

            if (l.HasRel("http://opds-spec.org/facet")) {
                opds2feed.AddFacet(linkFeed, l.FacetGroup);
            } else {
                if (!opds2feed.Links) {
                    opds2feed.Links = [];
                }
                opds2feed.Links.push(linkFeed);
            }
        });
    }

    return opds2feed;
}
