/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {Complex, ComplexInputs, KernelConfig, KernelFunc, TensorInfo} from '@tensorflow/tfjs-core';

import {MathBackendWebGL} from '../backend_webgl';

/**
 * In WebGL data is stored in GPU textures which can't be efficiently copied, so
 * complex tensors share data with their real and imaginary components. Complex
 * tensors increment the `keptRefCount` properties of the underlying data
 * buckets to prevent them from being disposed, as the engine's disposal logic
 * does not account for data sharing by complex tensors.
 *
 * When a complex tensor is disposed, it will explicitly decrease the
 * `keptRefCount` properties of its underlying components.
 */
export function complex(
    args: {inputs: ComplexInputs, backend: MathBackendWebGL}): TensorInfo {
  const {inputs, backend} = args;
  const {real, imag} = inputs;

  const complexInfo = backend.makeTensorInfo(real.shape, 'complex64');
  const complex = backend.texData.get(complexInfo.dataId);

  backend.incRef(real.dataId);
  const realData = backend.texData.get(real.dataId);
  realData.keptRefCount++;
  const realTensorInfo:
      TensorInfo = {dataId: real.dataId, shape: real.shape, dtype: 'float32'};

  backend.incRef(imag.dataId);
  const imagData = backend.texData.get(imag.dataId);
  imagData.keptRefCount++;
  const imagTensorInfo:
      TensorInfo = {dataId: imag.dataId, shape: imag.shape, dtype: 'float32'};

  complex.complexTensorInfos = {real: realTensorInfo, imag: imagTensorInfo};

  return complexInfo;
}

export const complexConfig: KernelConfig = {
  kernelName: Complex,
  backendName: 'webgl',
  kernelFunc: complex as {} as KernelFunc
};
