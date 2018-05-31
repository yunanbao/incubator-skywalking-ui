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
import { Avatar } from 'antd';
import DescriptionList from '../../components/DescriptionList';

const { Description } = DescriptionList;

export default class ApplicationLitePanel extends PureComponent {
  render() {
    const { appInfo } = this.props;
    return (
      <div>
        {appInfo.isAlarm ? <Avatar style={{ backgroundColor: '#F04864', marginBottom: 10 }} icon="bell" /> : null}
        <DescriptionList col={1} layout="vertical" >
          <Description term="正常运行时间">{appInfo.sla}%</Description>
          <Description term="平均每分钟调用次数">{appInfo.cpm}</Description>
          <Description term="平均响应时间">{appInfo.avgResponseTime} ms</Description>
          <Description term="总服务器数">{appInfo.numOfServer}</Description>
        </DescriptionList>
      </div>
    );
  }
}
