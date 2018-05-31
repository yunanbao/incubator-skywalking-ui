/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import React, { PureComponent } from 'react';
import { Tag, List, Tabs, Card, Row, Col, Badge } from 'antd';
import * as d3 from 'd3';
import moment from 'moment';
import { formatDuration } from '../../utils/time';
import DescriptionList from '../../components/DescriptionList';
import styles from './index.less';

const { TabPane } = Tabs;
const { Description } = DescriptionList;

const colors = [
  '#1890FF',
  '#F04864',
  '#2FC25B',
  '#FACC14',
  '#13C2C2',
  '#8543E0',
];
const height = 36;
const margin = 10;
const offX = 15;
const offY = 6;
const timeFormat = 'YYYY-MM-DD HH:mm:ss.SSS';
class TraceStack extends PureComponent {
  state = {
    nodes: [],
    idMap: {},
    colorMap: {},
    bap: [],
    visible: false,
    span: {},
  }
  componentWillMount() {
    const { spans } = this.props;
    let colorIndex = 0;
    spans.forEach((span) => {
      const { colorMap } = this.state;
      if (!colorMap[span.applicationCode]) {
        colorMap[span.applicationCode] = colors[colorIndex];
        colorIndex = (colorIndex < colors.length - 1) ? (colorIndex + 1) : 0;
      }
      this.buildNode(span);
    });
    const { nodes } = this.state;
    const minStartTimeNode = nodes.reduce((acc, n) => (acc.startTime > n.startTime ? n : acc));
    this.state.nodes = nodes.map(n =>
      ({ ...n, startOffset: n.startTime - minStartTimeNode.startTime }));
  }
  componentDidMount() {
    this.state.width = this.axis.parentNode.clientWidth - 50;
    this.drawAxis();
    this.displayData();
    window.addEventListener('resize', this.resize);
  }
  buildNode = (span) => {
    const { nodes, idMap } = this.state;
    const node = {};
    node.applicationCode = span.applicationCode;
    node.startTime = span.startTime;
    node.endTime = span.endTime;
    node.duration = span.endTime - span.startTime;
    node.content = span.operationName;
    node.spanSegId = this.id(span.segmentId, span.spanId);
    node.parentSpanSegId = this.findParent(span);
    node.refs = span.refs;
    node.type = span.type;
    node.peer = span.peer;
    node.component = span.component;
    node.isError = span.isError;
    node.layer = span.layer;
    node.tags = span.tags;
    node.logs = span.logs;
    nodes.push(node);
    idMap[node.spanSegId] = nodes.length - 1;
  }
  id = (...seg) => seg.join();
  findParent = (span) => {
    const { spans } = this.props;
    if (span.refs) {
      const ref = span.refs.find(_ => spans.findIndex(s =>
        this.id(_.parentSegmentId, _.parentSpanId) === this.id(s.segmentId, s.spanId)) > -1);
      if (ref) {
        return this.id(ref.parentSegmentId, ref.parentSpanId);
      }
    }
    const result = this.id(span.segmentId, span.parentSpanId);
    if (spans.findIndex(s => result === this.id(s.segmentId, s.spanId)) > -1) {
      return result;
    }
    return null;
  }
  drawAxis = () => {
    const { width } = this.state;
    const { nodes, bap } = this.state;
    const dataSet = nodes.map(node => node.startOffset + node.duration);
    const bits = d3.max(dataSet).toString().length;
    const percentScale = Math.ceil(d3.max(dataSet) / (10 ** (bits - 2)));
    const axisHeight = 20;

    const svg = d3.select(this.axis).append('svg')
      .attr('width', width)
      .attr('height', axisHeight)
      .attr('style', 'overflow: visible');

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(dataSet)])
      .range([0, width]);

    const axis = d3.axisTop(xScale).ticks(4).tickSize([(height * nodes.length) + 40])
      .tickFormat(formatDuration);

    svg.append('g')
      .attr('class', styles.axis)
      .attr('transform', `translate(0, ${axisHeight})`)
      .call(axis);

    bap.push(bits);
    bap.push(percentScale);
    return bap;
  }
  displayData = () => {
    const { nodes, bap, width, colorMap } = this.state;
    const svgContainer = d3.select(this.duration).append('svg').attr('height', height * nodes.length).attr('style', 'overflow: visible');
    const positionMap = {};
    nodes.forEach((node, index) => {
      const { startOffset: startTime, duration, content,
        applicationCode, spanSegId, parentSpanSegId } = node;

      const rectWith = ((duration * width) / (bap[1] * (10 ** (bap[0] - 4)))) / 100;
      const beginX = ((startTime * width) / (bap[1] * (10 ** (bap[0] - 4)))) / 100;
      const bar = svgContainer.append('g').attr('transform', (d, i) => `translate(0,${i * height})`);

      const beginY = index * height;
      positionMap[spanSegId] = { x: beginX, y: beginY };
      const rectHeight = height - margin;
      const container = bar.append('rect').attr('spanSegId', spanSegId).attr('x', -5).attr('y', beginY - 5)
        .attr('width', width + 10)
        .attr('height', rectHeight + 10)
        .attr('class', styles.backgroudHide)
        .on('mouseover', () => { this.selectTimeline(container, true); })
        .on('mouseout', () => { this.selectTimeline(container, false); })
        .on('click', () => { this.showSpanModal(node); });

      bar.append('rect').attr('x', beginX).attr('y', beginY).attr('width', rectWith)
        .attr('height', rectHeight)
        .on('mouseover', () => { this.selectTimeline(container, true); })
        .on('mouseout', () => { this.selectTimeline(container, false); })
        .on('click', () => { this.showSpanModal(node); })
        .style('fill', colorMap[applicationCode]);

      bar.append('text')
        .attr('x', beginX + 5)
        .attr('y', (index * height) + (height / 2))
        .attr('class', styles.rectText)
        .on('mouseover', () => { this.selectTimeline(container, true); })
        .on('mouseout', () => { this.selectTimeline(container, false); })
        .on('click', () => { this.showSpanModal(node); })
        .text(`${content} ${formatDuration(duration)}`);
      if (node.isError) {
        bar.append('svg:image')
          .attr('xlink:href', 'img/icon/error.png')
          .attr('x', width + (rectHeight / 2))
          .attr('y', beginY)
          .attr('width', rectHeight)
          .attr('height', rectHeight);
      }
      if (index > 0 && positionMap[parentSpanSegId]) {
        const parentX = positionMap[parentSpanSegId].x;
        const parentY = positionMap[parentSpanSegId].y;

        const defs = svgContainer.append('defs');
        const arrowMarker = defs.append('marker')
          .attr('id', 'arrow')
          .attr('markerUnits', 'strokeWidth')
          .attr('markerWidth', 5)
          .attr('markerHeight', 5)
          .attr('viewBox', '-5 -5 10 10')
          .attr('refX', 0)
          .attr('refY', 0)
          .attr('orient', 'auto');
        arrowMarker.append('path')
          .attr('d', 'M 0,0 m -5,-5 L 5,0 L -5,5 Z')
          .attr('fill', '#8543e0').attr('opacity', 0.8);

        const parentLeftBottomX = parentX;
        const parentLeftBottomY = (Number(parentY) + Number(height)) - Number(margin);
        const selfMiddleX = beginX;
        const selfMiddleY = beginY + ((height - margin) / 2);
        if ((beginX - parentX) < 10) {
          svgContainer.append('line').attr('x1', parentLeftBottomX - offX).attr('y1', parentLeftBottomY - offY).attr('class', styles.connlines)
            .on('mouseover', () => { this.selectTimeline(container, true); })
            .on('mouseout', () => { this.selectTimeline(container, false); })
            .on('click', () => { this.showSpanModal(node); })
            .attr('x2', parentLeftBottomX)
            .attr('y2', parentLeftBottomY - offY);

          svgContainer.append('line').attr('x1', parentLeftBottomX - offX).attr('y1', parentLeftBottomY - offY).attr('class', styles.connlines)
            .on('mouseover', () => { this.selectTimeline(container, true); })
            .on('mouseout', () => { this.selectTimeline(container, false); })
            .on('click', () => { this.showSpanModal(node); })
            .attr('x2', parentLeftBottomX - offX)
            .attr('y2', selfMiddleY);

          svgContainer.append('line').attr('x1', parentLeftBottomX - offX).attr('y1', selfMiddleY).attr('class', styles.connlines)
            .on('mouseover', () => { this.selectTimeline(container, true); })
            .on('mouseout', () => { this.selectTimeline(container, false); })
            .on('click', () => { this.showSpanModal(node); })
            .attr('x2', selfMiddleX - 5)
            .attr('y2', selfMiddleY)
            .attr('marker-end', 'url(#arrow)');
        } else {
          svgContainer.append('line').attr('x1', parentLeftBottomX).attr('y1', parentLeftBottomY).attr('class', styles.connlines)
            .on('mouseover', () => { this.selectTimeline(container, true); })
            .on('mouseout', () => { this.selectTimeline(container, false); })
            .on('click', () => { this.showSpanModal(node); })
            .attr('x2', parentLeftBottomX)
            .attr('y2', selfMiddleY);

          svgContainer.append('line').attr('x1', parentLeftBottomX).attr('y1', selfMiddleY).attr('class', styles.connlines)
            .on('mouseover', () => { this.selectTimeline(container, true); })
            .on('mouseout', () => { this.selectTimeline(container, false); })
            .on('click', () => { this.showSpanModal(node); })
            .attr('x2', selfMiddleX - 5)
            .attr('y2', selfMiddleY)
            .attr('marker-end', 'url(#arrow)');
        }
      }
    });
  }
  selectTimeline = (container, isOver) => {
    container.attr('class', isOver ? styles.backgroud : styles.backgroudHide);
  }
  showSpanModal = (span) => {
    this.setState({
      ...this.state,
      visible: true,
      span,
    });
  }
  resize = () => {
    if (!this.axis) {
      return;
    }
    this.state.width = this.axis.parentNode.clientWidth - 50;
    if (!this.axis || this.state.width <= 0) {
      return;
    }
    this.axis.innerHTML = '';
    this.duration.innerHTML = '';
    this.drawAxis();
    this.displayData();
  }
  renderTitle = (items) => {
    return (
      <Row type="flex" justify="start" gutter={15}>
        {
          items.map((_) => {
            return (
              <Col key={_.name}>
                <span>{_.name}</span>
                <Badge count={_.count} style={{ backgroundColor: '#1890FF', marginLeft: 5 }} />
              </Col>
            );
          })
        }
      </Row>
    );
  }
  render() {
    const { colorMap, span = {} } = this.state;
    const legendButtons = Object.keys(colorMap).map(key =>
      (<Tag color={colorMap[key]} key={key}>{key}</Tag>));
    let data;
    if (span.content) {
      const base = [
        {
          title: 'span type',
          content: span.type,
        },
        {
          title: 'component',
          content: span.component,
        },
        {
          title: 'peer',
          content: span.peer,
        },
        {
          title: 'is error',
          content: `${span.isError}`,
        },
      ];
      data = base.concat(span.tags.map(t => ({ title: t.key, content: t.value })));
    }
    const logs = span.logs ? (
      <TabPane tab="Logs" key={2}>
        <List
          itemLayout="horizontal"
          dataSource={span.logs}
          renderItem={log => (
            <List.Item>
              <List.Item.Meta
                size="small"
                title={moment(log.time).format('mm:ss.SSS')}
                description={
                  <DescriptionList layout="vertical" col={1}>
                    {log.data.map(_ =>
                      <Description key={_.key} term={_.key}>{_.value}</Description>)}
                  </DescriptionList>
                }
              />
            </List.Item>
          )}
        />
      </TabPane>
    ) : null;
    const relatedTraces = (span.parentSpanSegId || !span.refs) ? null : (
      <TabPane tab="Related Trace" key={3}>
        <DescriptionList layout="vertical">
          {span.refs.map(_ => <Description key={_.type} term={_.type}>{_.traceId}</Description>)}
        </DescriptionList>
      </TabPane>
    );
    return (
      <div className={styles.stack}>
        <div style={{ paddingBottom: 10 }}>
          { legendButtons }
        </div>
        <div className={styles.duration} ref={(el) => { this.duration = el; }} />
        <div ref={(el) => { this.axis = el; }} />
        {data ? (
          <Card
            type="inner"
            title={span.content}
          >
            {this.renderTitle([
              {
                name: '开始时间',
                count: `${moment(span.startTime).format(timeFormat)}`,
              },
              {
                name: '响应时间',
                count: `${formatDuration(span.duration)}`,
              },
            ])}
            <Tabs defaultActiveKey="1">
              <TabPane tab="Tags" key="1">
                <DescriptionList layout="vertical">
                  {data.map(_ =>
                    <Description key={_.title} term={_.title}>{_.content}</Description>)}
                </DescriptionList>
              </TabPane>
              {logs}
              {relatedTraces}
            </Tabs>
          </Card>
        ) : null}
      </div>
    );
  }
}

export default TraceStack;
