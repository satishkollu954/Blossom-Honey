
import AdvertisementRenderer from "../advertisementbackground/AdvertisementBackground";
import Review from "../CustomerReview/Review";
import { FeaturedProducts } from "../FeaturedProducts/Featuredproducts";
import { Main } from "../Main/Main";
import WhyBlossom from "../WhyBlossom/WhyBlossom";


export function Index() {
    return (
        <div>

            <Main />

            <AdvertisementRenderer position="popup" type="background" />
            <FeaturedProducts />
            <AdvertisementRenderer position="sidebar" />
            <WhyBlossom />
            <Review />

        </div>
    );
}