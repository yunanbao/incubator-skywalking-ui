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
import { Row, Col, Card, Select, Icon } from 'antd';
import {
  ChartCard, MiniArea, MiniBar,
} from '../../components/Charts';
import DescriptionList from '../../components/DescriptionList';
import { axis } from '../../utils/time';
import { avgTimeSeries, getServerId } from '../../utils/utils';

const { Option } = Select;
const { Description } = DescriptionList;

export default class ServerLitePanel extends PureComponent {
  bytesToMB = list => list.map(_ => parseFloat((_ / (1024 ** 2)).toFixed(2)))
  render() {
    const { serverList, duration, data, onSelectServer, onMoreServer } = this.props;
    if (serverList.length < 1) {
      return null;
    }
    const { serverInfo, getServerResponseTimeTrend, getServerThroughputTrend } = data;
    if (!serverInfo.key) {
      onSelectServer(serverList[0].key, serverList[0]);
    }
    return (
      <div>
        <Row gutter={0}>
          <Col span={24}>
            <Select
              size="small"
              value={serverInfo.key}
              onChange={value => onSelectServer(value, serverList.find(_ => _.key === value))}
              style={{ width: '100%' }}
            >
              {serverList.map(_ => <Option key={_.key} value={_.key}>{getServerId(_)}</Option>)}
            </Select>
          </Col>
          <Col span={24}>
            <Card bordered={false} bodyStyle={{ padding: 5 }}>
              <DescriptionList col={1} gutter={0} size="small">
                <Description term="主机名">{serverInfo.host}</Description>
                <Description term="系统">{serverInfo.osName}</Description>
              </DescriptionList>
            </Card>
          </Col>
          <Col span={24}>
            <ChartCard
              title="平均每分钟调用次数"
              total={`${avgTimeSeries(getServerThroughputTrend.trendList)} cpm`}
              contentHeight={46}
              bordered={false}
              bodyStyle={{ padding: 5 }}
            >
              <MiniBar
                data={axis(duration, getServerThroughputTrend.trendList)}
                color="#975FE4"
              />
            </ChartCard>
          </Col>
          <Col span={24}>
            <ChartCard
              title="平均响应时间"
              total={`${avgTimeSeries(getServerResponseTimeTrend.trendList)} ms`}
              contentHeight={46}
              bordered={false}
              bodyStyle={{ padding: 5 }}
            >
              {getServerResponseTimeTrend.trendList.length > 0 ? (
                <MiniArea
                  animate={false}
                  color="#87cefa"
                  data={axis(duration, getServerResponseTimeTrend.trendList)}
                />
              ) : (<span style={{ display: 'none' }} />)}
            </ChartCard>
          </Col>
        </Row>
        {serverInfo.key ? <a style={{ float: 'right' }} onClick={onMoreServer}>更多服务器详情<Icon type="ellipsis" /> </a> : null}
      </div>
    );
  }
}
