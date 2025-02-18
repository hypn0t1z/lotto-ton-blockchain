import React from 'react';
import { Icons } from '@/assets/icons';

import { Input } from '@/components/ui/input';

const FaqHead = () => {
  return (
    <div className="space-y-5 container">
      <h1 className="text-2xl text-center">We're here to help you with anything and everything</h1>

      <p className="text-xs text-gray-color text-justify">
        At lottery we expect at a day’s start is you, better and happier than yesterday. We have got you covered share
        your concern or check our frequently asked questions listed below.{' '}
      </p>

      <Input
        placeholder="Search for anything"
        className="placeholder:text-white bg-gray-color h-12 rounded-lg"
        prefix={<Icons.search className="text-white w-5 h-5" />}
      />
    </div>
  );
};

export default FaqHead;
