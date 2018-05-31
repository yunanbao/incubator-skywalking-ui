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
import { connect } from 'dva';
import { Row, Col, Card, Tooltip, Icon } from 'antd';
import {
  ChartCard, MiniArea, Field, HeatMap,
} from '../../components/Charts';
import { axis } from '../../utils/time';
import { avgTimeSeries, redirect } from '../../utils/utils';
import { Panel } from '../../components/Page';
import RankList from '../../components/RankList';

@connect(state => ({
  dashboard: state.dashboard,
  duration: state.global.duration,
  globalVariables: state.global.globalVariables,
}))
export default class Dashboard extends PureComponent {
  handleDurationChange = (variables) => {
    this.props.dispatch({
      type: 'dashboard/fetchData',
      payload: { variables },
    });
  }
  renderAction = (prompt, path) => {
    return (
      <Tooltip title={prompt}>
        <Icon type="info-circle-o" onClick={() => redirect(this.props.history, path)} />
      </Tooltip>
    );
  }
  render() {
    const { data } = this.props.dashboard;
    const { numOfAlarmRate } = data.getAlarmTrend;
    const accuracy = 100;
    let visitData = [];
    let avg = 0;
    let max = 0;
    let min = 0;
    if (numOfAlarmRate && numOfAlarmRate.length > 0) {
      visitData = axis(this.props.duration, numOfAlarmRate, ({ x, y }) => ({ x, y: y / accuracy }));
      avg = avgTimeSeries(numOfAlarmRate) / accuracy;
      max = numOfAlarmRate.reduce((acc, curr) => { return acc < curr ? curr : acc; }) / accuracy;
      min = numOfAlarmRate.reduce((acc, curr) => { return acc > curr ? curr : acc; }) / accuracy;
    }
    return (
      <Panel globalVariables={this.props.globalVariables} onChange={this.handleDurationChange}>
        <Row gutter={8}>
          <Col xs={24} sm={24} md={12} lg={6} xl={6}>
            <ChartCard
              title="应用"
              action={this.renderAction('应用详情', '/monitor/application')}
              avatar={<img style={{ width: 56, height: 56 }} src="img/icon/app.png" alt="应用" />}
              total={data.getClusterBrief.numOfApplication}
            />
          </Col>
          <Col xs={24} sm={24} md={12} lg={6} xl={6}>
            <ChartCard
              title="服务"
              action={this.renderAction('服务详情', '/monitor/service')}
              avatar={<img style={{ width: 56, height: 56 }} src="img/icon/service.png" alt="服务" />}
              total={data.getClusterBrief.numOfService}
            />
          </Col>
          <Col xs={24} sm={24} md={12} lg={6} xl={6}>
            <ChartCard
              title="数据库 & 缓存"
              avatar={<img style={{ width: 56, height: 56 }} src="img/icon/database.png" alt="数据库 & 缓存" />}
              total={data.getClusterBrief.numOfDatabase
                + data.getClusterBrief.numOfCache}
            />
          </Col>
          <Col xs={24} sm={24} md={12} lg={6} xl={6}>
            <ChartCard
              title="消息队列"
              avatar={<img style={{ width: 56, height: 56 }} src="img/icon/mq.png" alt="消息队列" />}
              total={data.getClusterBrief.numOfMQ}
            />
          </Col>
        </Row>
        <Row gutter={8}>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} style={{ marginTop: 8 }}>
            <ChartCard
              title="调用热力图"
              contentHeight={200}
            >
              <HeatMap
                data={data.getThermodynamic}
                duration={this.props.duration}
                height={200}
              />
            </ChartCard>
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} style={{ marginTop: 8 }}>
            <ChartCard
              title="应用平均报警率"
              avatar={<img style={{ width: 56, height: 56 }} src="img/icon/alert.png" alt="平均应用报警率" />}
              total={`${avg.toFixed(2)}%`}
              footer={<div><Field label="最高" value={`${max}%`} /> <Field label="最低" value={`${min}%`} /></div>}
              contentHeight={100}
            >
              <MiniArea
                animate={false}
                color="#D87093"
                borderColor="#B22222"
                line="true"
                data={visitData}
                yAxis={{
                  formatter(val) {
                      return `${val} %`;
                  },
                }}
              />
            </ChartCard>
          </Col>
        </Row>
        <Row gutter={8}>
          <Col xs={24} sm={24} md={24} lg={16} xl={16} style={{ marginTop: 8 }}>
            <Card
              title="慢服务Top10"
              bordered={false}
              bodyStyle={{ padding: '0px 10px' }}
            >
              <RankList
                data={data.getTopNSlowService}
                renderValue={_ => `${_.value} ms`}
                onClick={(key, item) => redirect(this.props.history, '/monitor/service', { key, label: item.label })}
              />
            </Card>
          </Col>
          <Col xs={24} sm={24} md={24} lg={8} xl={8} style={{ marginTop: 8 }}>
            <Card
              title="应用每分钟调用次数Top10"
              bordered={false}
              bodyStyle={{ padding: '0px 10px' }}
            >
              <RankList
                data={data.getTopNApplicationThroughput}
                renderValue={_ => `${_.value} cpm`}
                color="#965fe466"
                onClick={(key, item) => redirect(this.props.history, '/monitor/application', { key, label: item.label })}
              />
            </Card>
          </Col>
        </Row>
      </Panel>
    );
  }
}
